"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, Trash2, Coffee, Apple, Pizza, Utensils, Plus, Minus } from "lucide-react"
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

interface DietTrackerProps {
  stats: DailyStats[string]
  updateStats: (newStats: DailyStats[string]) => void
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

export default function DietTracker({ stats, updateStats }: DietTrackerProps) {
  const [meals, setMeals] = useState<Meal[]>([])
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

  const addMeal = () => {
    if (!newMeal.name) return

    const meal: Meal = {
      ...newMeal,
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

    setDialogOpen(false)
  }

  const removeMeal = (id: string) => {
    const meal = meals.find((m) => m.id === id)
    if (!meal) return

    setMeals(meals.filter((m) => m.id !== id))

    // Update calories consumed
    updateStats({
      ...stats,
      calories: {
        ...stats.calories,
        consumed: stats.calories.consumed - meal.calories,
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
      <Card>
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
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-2">{getMealIcon(meal.type)}</div>
                    <div>
                      <p className="font-medium">{meal.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{meal.calories} kcal</span>
                        <span>•</span>
                        <span>{meal.time}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeMeal(meal.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </CardContent>
        <CardFooter>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Meal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a Meal</DialogTitle>
                <DialogDescription>Enter the details of your meal to track your calorie intake.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="meal-name">Meal Name</Label>
                  <Input
                    id="meal-name"
                    value={newMeal.name}
                    onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
                    placeholder="e.g., Chicken Salad"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="meal-type">Meal Type</Label>
                  <Select
                    value={newMeal.type}
                    onValueChange={(value) => setNewMeal({ ...newMeal, type: value as any })}
                  >
                    <SelectTrigger id="meal-type">
                      <SelectValue placeholder="Select meal type" />
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
                <div className="grid gap-2">
                  <Label htmlFor="meal-calories">Calories (kcal)</Label>
                  <Input
                    id="meal-calories"
                    type="number"
                    value={newMeal.calories}
                    onChange={(e) => setNewMeal({ ...newMeal, calories: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="meal-protein">Protein (g)</Label>
                    <Input
                      id="meal-protein"
                      type="number"
                      value={newMeal.protein}
                      onChange={(e) => setNewMeal({ ...newMeal, protein: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="meal-carbs">Carbs (g)</Label>
                    <Input
                      id="meal-carbs"
                      type="number"
                      value={newMeal.carbs}
                      onChange={(e) => setNewMeal({ ...newMeal, carbs: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="meal-fat">Fat (g)</Label>
                    <Input
                      id="meal-fat"
                      type="number"
                      value={newMeal.fat}
                      onChange={(e) => setNewMeal({ ...newMeal, fat: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={addMeal}>Add Meal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>

      <Card>
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
                  stroke="#3b82f6"
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
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => updateWater(1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Nutrition Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-primary/10 p-3 text-center">
                <p className="text-xs text-muted-foreground">Protein</p>
                <p className="text-lg font-bold">{meals.reduce((sum, meal) => sum + meal.protein, 0)}g</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3 text-center">
                <p className="text-xs text-muted-foreground">Carbs</p>
                <p className="text-lg font-bold">{meals.reduce((sum, meal) => sum + meal.carbs, 0)}g</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3 text-center">
                <p className="text-xs text-muted-foreground">Fat</p>
                <p className="text-lg font-bold">{meals.reduce((sum, meal) => sum + meal.fat, 0)}g</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

