"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  PlusCircle,
  Trash2,
  Coffee,
  Apple,
  Pizza,
  Utensils,
  Plus,
  Minus,
  Search,
  Loader2,
  ScanLine,
  AlertCircle,
  Camera,
  Check,
  X
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DailyStats } from "@/lib/types"
import { useLocalStorage } from "@/hooks/use-local-storage"

interface DietTrackerProps {
  stats: DailyStats[string]
  updateStats: (newStats: DailyStats[string]) => void
  dateKey?: string
}

interface Meal {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  time: string
  type: "breakfast" | "lunch" | "dinner" | "snack"
}

interface SearchResult {
  id: string
  name: string
  brand: string
  calories: number
  protein: number
  carbs: number
  fat: number
  image: string
}

export default function DietTracker({ stats, updateStats, dateKey }: DietTrackerProps) {
  // Offline persistence of meals separated by date
  const [allMeals, setAllMeals] = useLocalStorage<Record<string, Meal[]>>("fitness-meals", {})
  const activeDate = dateKey || new Date().toISOString().split("T")[0]
  const meals = (allMeals && allMeals[activeDate]) || []

  const setMeals = (newMeals: Meal[]) => {
    setAllMeals({
      ...(allMeals || {}),
      [activeDate]: newMeals,
    })
  }

  const [newMeal, setNewMeal] = useState<Omit<Meal, "id">>({
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    time: new Date().toTimeString().slice(0, 5),
    type: "breakfast",
  })
  const [dialogOpen, setDialogOpen] = useState(false)

  // Search & Barcode & Serving States
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchStatusMessage, setSearchStatusMessage] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  
  // Real-time Serving Size State
  const [baselineNutrition, setBaselineNutrition] = useState<{
    calories: number
    protein: number
    carbs: number
    fat: number
  } | null>(null)
  const [servingSize, setServingSize] = useState<number>(100)

  // Camera & Barcode Scanner States
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannerLoading, setScannerLoading] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const controlsRef = useRef<any>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // PWA Install Banner States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  // Inline Form Alerts
  const [formAlert, setFormAlert] = useState<string | null>(null)

  // 1. PWA Install Event Handler
  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIOSDevice)

    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone
    
    if (isStandalone) {
      setShowInstallBanner(false)
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallBanner(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    if (isIOSDevice && !isStandalone) {
      setShowInstallBanner(true)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        console.log("User accepted the install prompt")
      }
      setDeferredPrompt(null)
      setShowInstallBanner(false)
    } else if (isIOS) {
      alert("To install FitTrack on iOS: tap the Share button in Safari and select 'Add to Home Screen'.")
      setShowInstallBanner(false)
    }
  }

  // 2. LocalStorage Caching Helpers
  const getCachedSearch = (query: string): SearchResult[] | null => {
    try {
      const cache = localStorage.getItem("off-search-cache")
      if (cache) {
        const parsed = JSON.parse(cache)
        return parsed[query.toLowerCase()] || null
      }
    } catch (e) {
      console.error(e)
    }
    return null
  }

  const setCachedSearch = (query: string, results: SearchResult[]) => {
    try {
      const cache = localStorage.getItem("off-search-cache")
      const parsed = cache ? JSON.parse(cache) : {}
      parsed[query.toLowerCase()] = results
      localStorage.setItem("off-search-cache", JSON.stringify(parsed))
    } catch (e) {
      console.error(e)
    }
  }

  // 3. Debounced Search Effect (500ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.trim().length >= 2 && !searchQuery.startsWith("Barcode:")) {
        performSearch(searchQuery)
      } else if (searchQuery.trim().length === 0) {
        setSearchResults([])
        setShowDropdown(false)
        setSearchStatusMessage(null)
      }
    }, 500)

    return () => clearTimeout(handler)
  }, [searchQuery])

  const performSearch = async (query: string) => {
    const cached = getCachedSearch(query)
    if (cached) {
      setSearchResults(cached)
      setSearchStatusMessage(cached.length === 0 ? "No results found — enter nutrition manually." : null)
      setShowDropdown(true)
      return
    }

    setSearchLoading(true)
    setSearchStatusMessage(null)
    setFormAlert(null)

    if (!navigator.onLine) {
      setSearchLoading(false)
      setSearchStatusMessage("You're offline — enter nutrition manually")
      setSearchResults([])
      setShowDropdown(true)
      return
    }

    try {
      const res = await fetch(`https://search.openfoodfacts.org/search?q=${encodeURIComponent(query)}&json=1&page_size=10`)
      
      if (res.status === 503) {
        setSearchStatusMessage("Food search unavailable right now — enter manually")
        setSearchResults([])
        setShowDropdown(true)
        return
      }

      if (!res.ok) throw new Error("Search request failed")

      const data = await res.json()
      const products = data.products || []

      if (products.length === 0) {
        setSearchStatusMessage("No results found — enter nutrition manually.")
        setSearchResults([])
        setShowDropdown(true)
        return
      }

      const mapped: SearchResult[] = products.map((p: any) => {
        const nutriments = p.nutriments || {}
        const caloriesVal = Math.round(
          nutriments["energy-kcal_100g"] !== undefined 
            ? Number(nutriments["energy-kcal_100g"])
            : (nutriments["energy-kcal"] !== undefined ? Number(nutriments["energy-kcal"]) : 0)
        )

        return {
          id: p.code || Math.random().toString(),
          name: p.product_name || p.product_name_en || "Unknown Product",
          brand: p.brands || "Generic",
          calories: caloriesVal,
          protein: Number(nutriments.proteins_100g || nutriments.proteins || 0),
          carbs: Number(nutriments.carbohydrates_100g || nutriments.carbohydrates || 0),
          fat: Number(nutriments.fat_100g || nutriments.fat || 0),
          image: p.image_front_small_url || p.image_small_url || p.image_thumb_url || "",
        }
      })

      setSearchResults(mapped)
      setCachedSearch(query, mapped)
      setShowDropdown(true)
    } catch (err) {
      console.error(err)
      setSearchStatusMessage("Food search unavailable right now — enter manually")
      setSearchResults([])
      setShowDropdown(true)
    } finally {
      setSearchLoading(false)
    }
  }

  // 4. Select Food Result
  const selectSearchResult = (item: SearchResult) => {
    setNewMeal((prev) => ({
      ...prev,
      name: item.name,
      calories: item.calories,
      protein: Math.round(item.protein),
      carbs: Math.round(item.carbs),
      fat: Math.round(item.fat),
    }))

    setBaselineNutrition({
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    })
    setServingSize(100)
    
    // Clear search states
    setSearchQuery(item.name)
    setShowDropdown(false)
    setFormAlert(null)
  }

  // 5. Real-Time Serving Size Adjuster
  const handleServingSizeChange = (size: number) => {
    setServingSize(size)
    if (!baselineNutrition) return

    const factor = size / 100
    setNewMeal((prev) => ({
      ...prev,
      calories: Math.round(baselineNutrition.calories * factor),
      protein: Math.round(baselineNutrition.protein * factor * 10) / 10,
      carbs: Math.round(baselineNutrition.carbs * factor * 10) / 10,
      fat: Math.round(baselineNutrition.fat * factor * 10) / 10,
    }))
  }

  // 6. Camera / Barcode Scanner Logic
  const startBarcodeScanner = async () => {
    setScannerOpen(true)
    setScannerLoading(true)
    setScannerError(null)
    setFormAlert(null)

    // Wait for DOM layout
    setTimeout(async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("unsupported")
        }

        if (!navigator.onLine) {
          throw new Error("offline")
        }

        const { BrowserMultiFormatReader } = await import("@zxing/browser")
        const codeReader = new BrowserMultiFormatReader()

        if (!videoRef.current) return

        const controls = await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          async (result, error) => {
            if (result) {
              const barcode = result.getText()
              controls.stop()
              controlsRef.current = null
              setScannerOpen(false)
              handleBarcodeScanned(barcode)
            }
          }
        )

        controlsRef.current = controls
        setScannerLoading(false)
      } catch (err: any) {
        console.error(err)
        setScannerLoading(false)
        if (err.message === "offline") {
          setScannerError("You're offline — enter nutrition manually")
        } else {
          setScannerError("Camera access denied — please search by name instead")
        }
      }
    }, 150)
  }

  const stopBarcodeScanner = () => {
    if (controlsRef.current) {
      controlsRef.current.stop()
      controlsRef.current = null
    }
    setScannerOpen(false)
    setScannerLoading(false)
    setScannerError(null)
  }

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop()
      }
    }
  }, [])

  const handleBarcodeScanned = async (barcode: string) => {
    setSearchLoading(true)
    setSearchQuery(`Barcode: ${barcode}`)
    setFormAlert(null)

    if (!navigator.onLine) {
      setSearchLoading(false)
      setFormAlert("You're offline — enter nutrition manually")
      return
    }

    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`)
      
      if (res.status === 503) {
        setFormAlert("Food search unavailable right now — enter manually")
        setSearchLoading(false)
        return
      }

      if (!res.ok) throw new Error("Barcode fetch failed")

      const data = await res.json()

      if (data.status === 1 && data.product) {
        const p = data.product
        const nutriments = p.nutriments || {}
        const caloriesVal = Math.round(
          nutriments["energy-kcal_100g"] !== undefined 
            ? Number(nutriments["energy-kcal_100g"])
            : (nutriments["energy-kcal"] !== undefined ? Number(nutriments["energy-kcal"]) : 0)
        )

        const scannedProduct: SearchResult = {
          id: p.code || barcode,
          name: p.product_name || p.product_name_en || "Scanned Product",
          brand: p.brands || "Generic",
          calories: caloriesVal,
          protein: Number(nutriments.proteins_100g || nutriments.proteins || 0),
          carbs: Number(nutriments.carbohydrates_100g || nutriments.carbohydrates || 0),
          fat: Number(nutriments.fat_100g || nutriments.fat || 0),
          image: p.image_front_small_url || p.image_small_url || p.image_thumb_url || "",
        }

        // Autofill form
        setNewMeal((prev) => ({
          ...prev,
          name: scannedProduct.name,
          calories: scannedProduct.calories,
          protein: Math.round(scannedProduct.protein),
          carbs: Math.round(scannedProduct.carbs),
          fat: Math.round(scannedProduct.fat),
        }))

        setBaselineNutrition({
          calories: scannedProduct.calories,
          protein: scannedProduct.protein,
          carbs: scannedProduct.carbs,
          fat: scannedProduct.fat,
        })
        setServingSize(100)
        setSearchQuery(scannedProduct.name)
      } else {
        setFormAlert("Product not found — enter nutrition manually")
      }
    } catch (err) {
      console.error(err)
      setFormAlert("Food search unavailable right now — enter manually")
    } finally {
      setSearchLoading(false)
    }
  }

  // 7. Core CRUD
  const addMeal = () => {
    const mealName = newMeal.name.trim() || searchQuery.trim()
    if (!mealName) {
      setFormAlert("Please enter or search for a food name.")
      return
    }

    const meal: Meal = {
      ...newMeal,
      name: mealName,
      id: Date.now().toString(),
    }

    setMeals([...meals, meal])

    // Update calories consumed
    updateStats({
      ...stats,
      calories: {
        ...stats.calories,
        consumed: stats.calories.consumed + meal.calories,
      },
    })

    // Reset form
    setNewMeal({
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      time: new Date().toTimeString().slice(0, 5),
      type: "breakfast",
    })

    setSearchQuery("")
    setBaselineNutrition(null)
    setServingSize(100)
    setFormAlert(null)
    setDialogOpen(false)
  }

  const removeMeal = (id: string) => {
    const meal = meals.find((m) => m.id === id)
    if (!meal) return

    setMeals(meals.filter((m) => m.id !== id))

    updateStats({
      ...stats,
      calories: {
        ...stats.calories,
        consumed: Math.max(0, stats.calories.consumed - meal.calories),
      },
    })
  }

  const updateWater = (change: number) => {
    updateStats({
      ...stats,
      water: {
        ...stats.water,
        consumed: Math.max(0, stats.water.consumed + change),
      },
    })
  }

  const getMealIcon = (type: Meal["type"]) => {
    switch (type) {
      case "breakfast":
        return <Coffee className="h-4 w-4" />
      case "lunch":
        return <Utensils className="h-4 w-4" />
      case "dinner":
        return <Pizza className="h-4 w-4" />
      case "snack":
        return <Apple className="h-4 w-4" />
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Install Banner */}
      {showInstallBanner && (
        <div className="col-span-1 md:col-span-2 flex items-center justify-between border border-[#1D9E75]/30 bg-[#1D9E75]/5 px-4 py-3 rounded-lg animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1D9E75] text-white text-sm">
              ✨
            </span>
            <div>
              <p className="text-xs font-semibold text-foreground">Install FitTrack App</p>
              <p className="text-[10px] text-muted-foreground">
                {isIOS 
                  ? "Tap Share and select 'Add to Home Screen' for instant access." 
                  : "Add FitTrack to your home screen for rapid offline logs."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isIOS && (
              <Button 
                onClick={handleInstallApp}
                className="bg-[#1D9E75] hover:bg-[#15825f] text-white text-xs px-3 py-1.5 h-auto border-none"
              >
                Install
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setShowInstallBanner(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Card className="shadow-none border-border">
        <CardHeader>
          <CardTitle>Meals</CardTitle>
          <CardDescription>Track your food intake throughout the day</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence>
            {meals.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <Utensils className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">No meals logged yet</p>
              </motion.div>
            ) : (
              meals.map((meal) => (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center justify-between rounded-lg border p-4 shadow-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#1D9E75]/10 p-2 text-[#1D9E75]">{getMealIcon(meal.type)}</div>
                    <div>
                      <p className="font-medium">{meal.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{meal.calories} kcal</span>
                        <span>•</span>
                        <span>{meal.time}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeMeal(meal.id)} className="hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </CardContent>
        <CardFooter>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              setSearchQuery("")
              setSearchResults([])
              setShowDropdown(false)
              setBaselineNutrition(null)
              setServingSize(100)
              setFormAlert(null)
            }
          }}>
            <DialogTrigger asChild>
              <Button className="w-full bg-[#1D9E75] hover:bg-[#15825f] text-white border-none">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Meal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add a Meal</DialogTitle>
                <DialogDescription>Search for foods or scan barcodes to auto-fill meal details.</DialogDescription>
              </DialogHeader>

              {/* Form Inline Alerts */}
              {formAlert && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{formAlert}</span>
                </div>
              )}

              <div className="grid gap-4 py-2">
                {/* Food Search with Debounce & Barcode Button */}
                <div className="grid gap-2 relative">
                  <Label htmlFor="food-search">Search Food (Open Food Facts)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="food-search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or brand..."
                        className="pr-9"
                      />
                      {searchLoading && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={startBarcodeScanner}
                      title="Scan Barcode"
                      className="bg-[#1D9E75]/10 hover:bg-[#1D9E75]/20 text-[#1D9E75] border-[#1D9E75]/20"
                    >
                      <ScanLine className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Search Results Dropdown */}
                  {showDropdown && (
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 max-h-[250px] overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-none">
                      {searchResults.length === 0 ? (
                        <div className="p-3 text-center text-xs text-muted-foreground">
                          {searchStatusMessage || "No results found — enter nutrition manually."}
                        </div>
                      ) : (
                        searchResults.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => selectSearchResult(item)}
                            className="flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground outline-none transition-colors"
                          >
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-8 w-8 rounded object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center flex-shrink-0 text-xs">
                                🍎
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-foreground">{item.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{item.brand}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="font-semibold text-[#1D9E75]">{item.calories}</span>
                              <span className="text-[9px] text-muted-foreground block">kcal/100g</span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="meal-name">Meal Name</Label>
                  <Input
                    id="meal-name"
                    value={newMeal.name}
                    onChange={(e) => {
                      setNewMeal({ ...newMeal, name: e.target.value })
                      if (baselineNutrition) setBaselineNutrition(null) // clear baseline since name changed manually
                    }}
                    placeholder="e.g., Chicken Salad"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="meal-type">Meal Type</Label>
                    <Select
                      value={newMeal.type}
                      onValueChange={(value) => setNewMeal({ ...newMeal, type: value as any })}
                    >
                      <SelectTrigger id="meal-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                        <SelectItem value="snack">Snack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="meal-time">Time</Label>
                    <Input
                      id="meal-time"
                      type="time"
                      value={newMeal.time}
                      onChange={(e) => setNewMeal({ ...newMeal, time: e.target.value })}
                    />
                  </div>
                </div>

                {/* Serving Size input */}
                {baselineNutrition && (
                  <div className="grid gap-2 border-t pt-3 border-border animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="serving-size" className="font-medium text-xs">Serving Size (g)</Label>
                      <span className="text-[10px] text-muted-foreground">Original values are per 100g</span>
                    </div>
                    <Input
                      id="serving-size"
                      type="number"
                      min="1"
                      value={servingSize}
                      onChange={(e) => handleServingSizeChange(Math.max(1, Number(e.target.value) || 0))}
                      placeholder="100"
                    />
                  </div>
                )}

                <div className="grid gap-2 border-t pt-3 border-border">
                  <Label htmlFor="meal-calories">Calories (kcal)</Label>
                  <Input
                    id="meal-calories"
                    type="number"
                    value={newMeal.calories}
                    onChange={(e) => {
                      setNewMeal({ ...newMeal, calories: Number.parseInt(e.target.value) || 0 })
                      if (baselineNutrition) setBaselineNutrition(null)
                    }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="meal-protein">Protein (g)</Label>
                    <Input
                      id="meal-protein"
                      type="number"
                      step="any"
                      value={newMeal.protein}
                      onChange={(e) => {
                        setNewMeal({ ...newMeal, protein: Number.parseFloat(e.target.value) || 0 })
                        if (baselineNutrition) setBaselineNutrition(null)
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="meal-carbs">Carbs (g)</Label>
                    <Input
                      id="meal-carbs"
                      type="number"
                      step="any"
                      value={newMeal.carbs}
                      onChange={(e) => {
                        setNewMeal({ ...newMeal, carbs: Number.parseFloat(e.target.value) || 0 })
                        if (baselineNutrition) setBaselineNutrition(null)
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="meal-fat">Fat (g)</Label>
                    <Input
                      id="meal-fat"
                      type="number"
                      step="any"
                      value={newMeal.fat}
                      onChange={(e) => {
                        setNewMeal({ ...newMeal, fat: Number.parseFloat(e.target.value) || 0 })
                        if (baselineNutrition) setBaselineNutrition(null)
                      }}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button onClick={addMeal} className="w-full bg-[#1D9E75] hover:bg-[#15825f] text-white border-none">
                  Add Meal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>

      <Card className="shadow-none border-border">
        <CardHeader>
          <CardTitle>Water Intake</CardTitle>
          <CardDescription>Track your hydration throughout the day</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center">
            <div className="relative mb-4 h-40 w-40">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#378ADD"
                  strokeWidth="10"
                  strokeDasharray="282.7"
                  strokeDashoffset={282.7 - 282.7 * (stats.water.consumed / stats.water.goal)}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 282.7 }}
                  animate={{ strokeDashoffset: 282.7 - 282.7 * (stats.water.consumed / stats.water.goal) }}
                  transition={{ duration: 1 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{stats.water.consumed}</span>
                <span className="text-sm text-muted-foreground">of {stats.water.goal} glasses</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateWater(-1)}
                disabled={stats.water.consumed <= 0}
                className="hover:bg-muted"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => updateWater(1)} className="hover:bg-muted">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Nutrition Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-[#1D9E75]/10 p-3 text-center">
                <p className="text-xs text-muted-foreground">Protein</p>
                <p className="text-lg font-bold text-[#1D9E75]">{meals.reduce((sum, meal) => sum + meal.protein, 0).toFixed(1)}g</p>
              </div>
              <div className="rounded-lg bg-[#EF9F27]/10 p-3 text-center">
                <p className="text-xs text-muted-foreground">Carbs</p>
                <p className="text-lg font-bold text-[#EF9F27]">{meals.reduce((sum, meal) => sum + meal.carbs, 0).toFixed(1)}g</p>
              </div>
              <div className="rounded-lg bg-[#7F77DD]/10 p-3 text-center">
                <p className="text-xs text-muted-foreground">Fat</p>
                <p className="text-lg font-bold text-[#7F77DD]">{meals.reduce((sum, meal) => sum + meal.fat, 0).toFixed(1)}g</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fullscreen Barcode Scanner Modal */}
      {scannerOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-950 text-white animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-zinc-950 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-[#1D9E75]" />
              <span className="font-semibold text-sm">Scan Barcode</span>
            </div>
            <Button
              variant="ghost"
              className="text-zinc-400 hover:text-white hover:bg-zinc-900 border-none px-3"
              onClick={stopBarcodeScanner}
            >
              Cancel
            </Button>
          </div>

          {/* Video Preview */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
            {scannerError ? (
              <div className="p-6 text-center max-w-xs flex flex-col items-center">
                <AlertCircle className="h-8 w-8 text-destructive mb-3" />
                <p className="text-xs text-zinc-300 mb-4">{scannerError}</p>
                <Button
                  onClick={stopBarcodeScanner}
                  className="w-full bg-[#1D9E75] hover:bg-[#15825f] text-white border-none text-xs"
                >
                  Go Back
                </Button>
              </div>
            ) : (
              <>
                {scannerLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-[#1D9E75] mb-2" />
                    <p className="text-xs text-zinc-400">Initializing camera...</p>
                  </div>
                )}
                
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />

                {/* Dashed scan area */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-64 h-44 border-2 border-dashed border-[#1D9E75] rounded-md">
                    {/* Bouncing laser line */}
                    <div className="absolute left-0 right-0 h-0.5 bg-[#1D9E75] shadow-[0_0_6px_#1D9E75] animate-bounce top-1/2" />
                  </div>
                </div>
                
                <div className="absolute bottom-6 left-6 right-6 text-center bg-black/75 py-2 px-4 rounded backdrop-blur-sm pointer-events-none">
                  <p className="text-[10px] text-zinc-300">Align barcode inside the frame to scan</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
