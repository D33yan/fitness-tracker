"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, Trash2, Timer, Dumbbell, MonitorIcon as Running, Activity } from "lucide-react"
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

  const addWorkout = () => {
    if (!newWorkout.name) return

    const workout: Workout = {
      ...newWorkout,
      id: Date.now().toString(),
    }

    setWorkouts([...workouts, workout])

    // Update calories burned and workouts completed
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

    // Reset form
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

    // Update calories burned and workouts completed
    updateStats({
      ...stats,
      calories: {
        ...stats.calories,
        burned: stats.calories.burned - workout.caloriesBurned,
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

  const getWorkoutIcon = (type: Workout["type"]) => {
    switch (type) {
      case "cardio":
        return <Running className="h-4 w-4" />
      case "strength":
        return <Dumbbell className="h-4 w-4" />
      case "flexibility":
        return <Activity className="h-4 w-4" />
      case "other":
        return <Timer className="h-4 w-4" />
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Workouts</CardTitle>
          <CardDescription>Track your exercise activities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-2">{getWorkoutIcon(workout.type)}</div>
                    <div>
                      <p className="font-medium">{workout.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{workout.duration} min</span>
                        <span>•</span>
                        <span>{workout.caloriesBurned} kcal</span>
                        <span>•</span>
                        <span>{workout.time}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeWorkout(workout.id)}>
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
                Add Workout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a Workout</DialogTitle>
                <DialogDescription>Enter the details of your workout to track your exercise.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
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
                  <Label htmlFor="workout-duration">Duration (minutes)</Label>
                  <Input
                    id="workout-duration"
                    type="number"
                    value={newWorkout.duration}
                    onChange={(e) => setNewWorkout({ ...newWorkout, duration: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="workout-calories">Calories Burned</Label>
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
              <DialogFooter>
                <Button onClick={addWorkout}>Add Workout</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step Counter</CardTitle>
          <CardDescription>Track your daily steps</CardDescription>
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
                  stroke="#10b981"
                  strokeWidth="10"
                  strokeDasharray="282.7"
                  strokeDashoffset={282.7 - 282.7 * (stats.steps.count / stats.steps.goal)}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 282.7 }}
                  animate={{ strokeDashoffset: 282.7 - 282.7 * (stats.steps.count / stats.steps.goal) }}
                  transition={{ duration: 1 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{stats.steps.count.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">of {stats.steps.goal.toLocaleString()} steps</span>
              </div>
            </div>
            <div className="w-full max-w-xs">
              <Label htmlFor="steps" className="text-center block mb-2">
                Update Steps
              </Label>
              <Input
                id="steps"
                type="number"
                value={stats.steps.count}
                onChange={(e) => updateSteps(Number.parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Activity Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-primary/10 p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Workouts</p>
                <p className="text-lg font-bold">{stats.workouts.completed}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3 text-center">
                <p className="text-xs text-muted-foreground">Calories Burned</p>
                <p className="text-lg font-bold">{stats.calories.burned}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

