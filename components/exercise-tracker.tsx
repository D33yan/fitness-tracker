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
  Timer,
  Dumbbell,
  MonitorIcon as Running,
  Activity,
  Footprints,
  Navigation,
  Play,
  Pause,
  Square,
  AlertCircle
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

interface ExerciseTrackerProps {
  stats: DailyStats[string]
  updateStats: (newStats: DailyStats[string]) => void
}

interface Workout {
  id: string
  name: string
  type: "cardio" | "strength" | "flexibility" | "other"
  duration: number
  caloriesBurned: number
  time: string
}

export default function ExerciseTracker({ stats, updateStats }: ExerciseTrackerProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [newWorkout, setNewWorkout] = useState<Omit<Workout, "id">>({
    name: "",
    type: "cardio",
    duration: 30,
    caloriesBurned: 0,
    time: new Date().toTimeString().slice(0, 5),
  })
  const [dialogOpen, setDialogOpen] = useState(false)

  // 1. Pedometer State
  const [pedometerActive, setPedometerActive] = useState(false)
  const lastXRef = useRef(0)
  const lastYRef = useRef(0)
  const lastZRef = useRef(0)
  const lastTimeRef = useRef(Date.now())

  // 2. GPS State
  const [gpsTracking, setGpsTracking] = useState(false)
  const [gpsPaused, setGpsPaused] = useState(false)
  const [gpsDistance, setGpsDistance] = useState(0)
  const [gpsTime, setGpsTime] = useState(0)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const lastCoordsRef = useRef<{ lat: number; lon: number } | null>(null)

  // Accelerometer Pedometer effect
  useEffect(() => {
    if (!pedometerActive) return

    const threshold = 15

    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity
      if (!acc) return

      const currentTime = Date.now()
      const diffTime = currentTime - lastTimeRef.current

      if (diffTime > 150) {
        const x = acc.x || 0
        const y = acc.y || 0
        const z = acc.z || 0

        const speed = Math.abs(x + y + z - lastXRef.current - lastYRef.current - lastZRef.current) / diffTime * 10000

        if (speed > threshold) {
          updateStats({
            ...stats,
            steps: {
              ...stats.steps,
              count: stats.steps.count + 1,
            },
          })
        }

        lastXRef.current = x
        lastYRef.current = y
        lastZRef.current = z
        lastTimeRef.current = currentTime
      }
    }

    const startPedometer = () => {
      if (
        typeof window !== "undefined" &&
        typeof (DeviceOrientationEvent as any).requestPermission === "function"
      ) {
        (DeviceOrientationEvent as any)
          .requestPermission()
          .then((permissionState: string) => {
            if (permissionState === "granted") {
              window.addEventListener("devicemotion", handleMotion)
            } else {
              alert("Accelerometer permission denied.")
              setPedometerActive(false)
            }
          })
          .catch((err: any) => {
            console.error(err)
            setPedometerActive(false)
          })
      } else {
        window.addEventListener("devicemotion", handleMotion)
      }
    }

    startPedometer()

    return () => {
      window.removeEventListener("devicemotion", handleMotion)
    }
  }, [pedometerActive])

  // GPS Stopwatch timer
  useEffect(() => {
    let timerId: any = null
    if (gpsTracking && !gpsPaused) {
      timerId = setInterval(() => {
        setGpsTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(timerId)
  }, [gpsTracking, gpsPaused])

  // GPS location watcher cleanup
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  // GPS Distance Tracking Handlers
  const startGpsTracking = () => {
    if (!("geolocation" in navigator)) {
      setGpsError("GPS Geolocation is not supported by your browser.")
      return
    }

    setGpsTracking(true)
    setGpsPaused(false)
    setGpsDistance(0)
    setGpsTime(0)
    setGpsError(null)
    lastCoordsRef.current = null

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371e3
      const phi1 = (lat1 * Math.PI) / 180
      const phi2 = (lat2 * Math.PI) / 180
      const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
      const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

      const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

      return R * c
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        
        if (accuracy > 25) return

        if (lastCoordsRef.current) {
          const delta = calculateDistance(
            lastCoordsRef.current.lat,
            lastCoordsRef.current.lon,
            latitude,
            longitude
          )
          
          if (delta > 2) {
            setGpsDistance((prev) => prev + delta)
          }
        }
        
        lastCoordsRef.current = { lat: latitude, lon: longitude }
      },
      (err) => {
        console.error(err)
        setGpsError("Location permission denied or unavailable.")
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    )

    watchIdRef.current = watchId
  }

  const toggleGpsPause = () => {
    setGpsPaused((prev) => !prev)
  }

  const stopGpsTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    const distanceKm = gpsDistance / 1000
    const caloriesBurned = Math.round(distanceKm * 65)
    const durationMins = Math.max(1, Math.round(gpsTime / 60))
    const estimatedSteps = Math.round(gpsDistance / 0.762)

    const sessionWorkout: Workout = {
      id: Date.now().toString(),
      name: `GPS Run (${distanceKm.toFixed(2)} km)`,
      type: "cardio",
      duration: durationMins,
      caloriesBurned: caloriesBurned,
      time: new Date().toTimeString().slice(0, 5),
    }

    setWorkouts((prev) => [...prev, sessionWorkout])

    updateStats({
      ...stats,
      calories: {
        ...stats.calories,
        burned: stats.calories.burned + caloriesBurned,
      },
      steps: {
        ...stats.steps,
        count: stats.steps.count + estimatedSteps,
      },
      workouts: {
        ...stats.workouts,
        completed: stats.workouts.completed + 1,
      },
    })

    setGpsTracking(false)
    setGpsPaused(false)
    setGpsDistance(0)
    setGpsTime(0)
    lastCoordsRef.current = null

    alert(
      `Workout Saved!\n\nDistance: ${distanceKm.toFixed(2)} km\nTime: ${durationMins} mins\nSteps added: +${estimatedSteps.toLocaleString()}\nCalories: ${caloriesBurned} kcal`
    )
  }

  const cancelGpsTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setGpsTracking(false)
    setGpsPaused(false)
    setGpsDistance(0)
    setGpsTime(0)
    lastCoordsRef.current = null
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Workouts CRUD
  const addWorkout = () => {
    if (!newWorkout.name) return

    const workout: Workout = {
      ...newWorkout,
      id: Date.now().toString(),
    }

    setWorkouts([...workouts, workout])

    updateStats({
      ...stats,
      calories: {
        ...stats.calories,
        burned: stats.calories.burned + workout.caloriesBurned,
      },
      workouts: {
        ...stats.workouts,
        completed: stats.workouts.completed + 1,
      },
    })

    setNewWorkout({
      name: "",
      type: "cardio",
      duration: 30,
      caloriesBurned: 0,
      time: new Date().toTimeString().slice(0, 5),
    })

    setDialogOpen(false)
  }

  const removeWorkout = (id: string) => {
    const workout = workouts.find((w) => w.id === id)
    if (!workout) return

    setWorkouts(workouts.filter((w) => w.id !== id))

    updateStats({
      ...stats,
      calories: {
        ...stats.calories,
        burned: Math.max(0, stats.calories.burned - workout.caloriesBurned),
      },
      workouts: {
        ...stats.workouts,
        completed: Math.max(0, stats.workouts.completed - 1),
      },
    })
  }

  const updateSteps = (steps: number) => {
    updateStats({
      ...stats,
      steps: {
        ...stats.steps,
        count: steps,
      },
    })
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* CARD 1: Workouts Logger */}
      <Card className="glass-card shadow-none border-border h-full flex flex-col justify-between">
        <div>
          <CardHeader>
            <CardTitle>Workouts</CardTitle>
            <CardDescription>Track your exercise activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            <AnimatePresence>
              {workouts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-8 text-center"
                >
                  <Dumbbell className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-sm text-muted-foreground">No workouts logged yet</p>
                </motion.div>
              ) : (
                workouts.map((workout) => (
                  <motion.div
                    key={workout.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center justify-between rounded-lg border p-4 shadow-none hover:border-[#EF9F27]/30 transition-all duration-300 bg-background/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-[#EF9F27]/10 p-2 text-[#EF9F27]">
                        {workout.type === "cardio" ? (
                          <Running className="h-4 w-4" />
                        ) : workout.type === "strength" ? (
                          <Dumbbell className="h-4 w-4" />
                        ) : workout.type === "flexibility" ? (
                          <Activity className="h-4 w-4" />
                        ) : (
                          <Timer className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{workout.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{workout.duration} min</span>
                          <span>•</span>
                          <span>{workout.caloriesBurned} kcal</span>
                          <span>•</span>
                          <span>{workout.time}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeWorkout(workout.id)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </CardContent>
        </div>
        <CardFooter className="pt-4 border-t">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-[#EF9F27] hover:bg-[#c4770e] text-white border-none">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Workout
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add a Workout</DialogTitle>
                <DialogDescription>Enter details of your workout to track your activity.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-3">
                <div className="grid gap-2">
                  <Label htmlFor="workout-name">Workout Name</Label>
                  <Input
                    id="workout-name"
                    value={newWorkout.name}
                    onChange={(e) => setNewWorkout({ ...newWorkout, name: e.target.value })}
                    placeholder="e.g., Morning Run"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="workout-type">Workout Type</Label>
                  <Select
                    value={newWorkout.type}
                    onValueChange={(value) => setNewWorkout({ ...newWorkout, type: value as any })}
                  >
                    <SelectTrigger id="workout-type">
                      <SelectValue placeholder="Select workout type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="strength">Strength</SelectItem>
                      <SelectItem value="flexibility">Flexibility</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="workout-time">Time</Label>
                    <Input
                      id="workout-time"
                      type="time"
                      value={newWorkout.time}
                      onChange={(e) => setNewWorkout({ ...newWorkout, time: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="workout-duration">Duration (mins)</Label>
                    <Input
                      id="workout-duration"
                      type="number"
                      value={newWorkout.duration}
                      onChange={(e) => setNewWorkout({ ...newWorkout, duration: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="workout-calories">Calories Burned (kcal)</Label>
                  <Input
                    id="workout-calories"
                    type="number"
                    value={newWorkout.caloriesBurned}
                    onChange={(e) =>
                      setNewWorkout({ ...newWorkout, caloriesBurned: Number.parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button onClick={addWorkout} className="w-full bg-[#EF9F27] hover:bg-[#c4770e] text-white border-none">
                  Add Workout
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>

      {/* CARD 2: Steps Counter & Accelerometer Pedometer */}
      <Card className="glass-card shadow-none border-border h-full flex flex-col justify-between">
        <div>
          <CardHeader>
            <CardTitle>Step Counter</CardTitle>
            <CardDescription>Track your physical daily steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex flex-col items-center">
            <div className="relative h-40 w-40">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsla(var(--muted-foreground), 0.1)" strokeWidth="8" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#EF9F27"
                  strokeWidth="8"
                  strokeDasharray="282.7"
                  strokeDashoffset={282.7 - 282.7 * (stats.steps.count / stats.steps.goal)}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 282.7 }}
                  animate={{ strokeDashoffset: 282.7 - 282.7 * (stats.steps.count / stats.steps.goal) }}
                  transition={{ duration: 1 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold tracking-tight text-[#EF9F27]">
                  {stats.steps.count.toLocaleString()}
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mt-0.5">
                  of {stats.steps.goal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Pedometer Hardware Trigger */}
            <div className="w-full flex items-center justify-between bg-muted/40 p-3 rounded-2xl border border-border/50">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${pedometerActive ? "bg-green-500 animate-ping" : "bg-zinc-400"}`} />
                <div className="text-left">
                  <p className="text-xs font-semibold uppercase tracking-wide">Accelerometer Tracker</p>
                  <p className="text-[9px] text-muted-foreground">Counts steps via phone movement</p>
                </div>
              </div>
              <Button
                variant={pedometerActive ? "default" : "outline"}
                className={`text-[10px] uppercase font-bold tracking-wider px-3.5 py-1.5 h-auto rounded-full border-muted/50 ${
                  pedometerActive ? "bg-[#EF9F27] hover:bg-[#c4770e] text-white border-none" : "bg-card text-foreground"
                }`}
                onClick={() => setPedometerActive((prev) => !prev)}
              >
                {pedometerActive ? "Active" : "Enable"}
              </Button>
            </div>
          </CardContent>
        </div>

        <CardFooter className="pt-4 border-t flex flex-col gap-2">
          <div className="w-full flex items-center justify-between">
            <Label htmlFor="steps" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Manually Update Steps
            </Label>
            <Footprints className="h-4 w-4 text-[#EF9F27]" />
          </div>
          <Input
            id="steps"
            type="number"
            value={stats.steps.count}
            onChange={(e) => updateSteps(Number.parseInt(e.target.value) || 0)}
            className="bg-background/50 h-9"
          />
        </CardFooter>
      </Card>

      {/* CARD 3: GPS Workout Tracker */}
      <Card className="glass-card shadow-none border-border h-full flex flex-col justify-between overflow-hidden">
        <div>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>GPS Run Tracker</span>
              <span className={`flex h-2.5 w-2.5 rounded-full ${gpsTracking && !gpsPaused ? "bg-[#1D9E75] animate-ping" : "bg-zinc-400"}`} />
            </CardTitle>
            <CardDescription>Track outdoor runs & strides via GPS</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-5">
            {gpsError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{gpsError}</span>
              </div>
            )}

            {/* Tracking dashboard */}
            <div className="bg-muted/40 border border-border/50 rounded-2xl p-4 text-center space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Distance</p>
                  <p className="text-2xl font-extrabold text-[#1D9E75]">
                    {(gpsDistance / 1000).toFixed(2)} <span className="text-xs font-semibold text-muted-foreground">km</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Active Time</p>
                  <p className="text-2xl font-extrabold font-mono tracking-tight text-foreground">
                    {formatTimer(gpsTime)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-3 border-border/40 text-xs">
                <div>
                  <p className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">Est. Steps</p>
                  <p className="font-bold text-[#EF9F27]">+{Math.round(gpsDistance / 0.762).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">Est. Calories</p>
                  <p className="font-bold text-red-500">+{Math.round((gpsDistance / 1000) * 65)} kcal</p>
                </div>
              </div>
            </div>
          </CardContent>
        </div>

        <CardFooter className="pt-4 border-t bg-muted/10">
          {!gpsTracking ? (
            <Button
              onClick={startGpsTracking}
              className="w-full bg-[#1D9E75] hover:bg-[#15825f] text-white border-none h-10 font-semibold"
            >
              <Navigation className="mr-2 h-4 w-4 animate-bounce" />
              Start GPS Run
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button
                onClick={toggleGpsPause}
                variant="outline"
                className="flex-1 h-10 text-xs font-semibold bg-card border-muted hover:bg-accent"
              >
                {gpsPaused ? (
                  <>
                    <Play className="mr-1.5 h-3.5 w-3.5 text-[#1D9E75]" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                    Pause
                  </>
                )}
              </Button>
              <Button
                onClick={stopGpsTracking}
                className="bg-[#1D9E75] hover:bg-[#15825f] text-white border-none flex-1 h-10 text-xs font-semibold"
              >
                <Square className="mr-1.5 h-3.5 w-3.5 fill-white" />
                Finish
              </Button>
              <Button
                onClick={cancelGpsTracking}
                variant="ghost"
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-10 px-2"
                title="Discard workout"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
