"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import DietTracker from "@/components/diet-tracker"
import ExerciseTracker from "@/components/exercise-tracker"
import SleepTracker from "@/components/sleep-tracker"
import MetricCard from "@/components/metric-card"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { type DailyStats, initialStats } from "@/lib/types"

export default function Dashboard() {
  const [date, setDate] = useState<Date>(new Date())
  const [stats, setStats] = useLocalStorage<DailyStats>("fitness-stats", initialStats)

  const dateKey = format(date, "yyyy-MM-dd")
  const todayStats = stats[dateKey] || {
    calories: { consumed: 0, burned: 0, goal: 2000 },
    water: { consumed: 0, goal: 8 },
    steps: { count: 0, goal: 10000 },
    sleep: { hours: 0, quality: 0, goal: 8 },
    workouts: { completed: 0, goal: 1 },
  }

  const updateStats = (newStats: typeof todayStats) => {
    setStats({
      ...stats,
      [dateKey]: newStats,
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="rounded-full bg-primary p-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-primary-foreground"
                >
                  <path d="M18.9 9.5c.1.4.1.8.1 1.2a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 7.5-7.5c.4 0 .8 0 1.2.1" />
                  <path d="M19 6v3h-3" />
                  <path d="M12 7v5l2 2" />
                </svg>
              </div>
            </motion.div>
            <h1 className="text-xl font-bold">FitTrack</h1>
          </div>
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{format(date, "PPP")}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
              </PopoverContent>
            </Popover>
            <Button variant="default">Profile</Button>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Calories"
            value={todayStats.calories.consumed}
            goal={todayStats.calories.goal}
            unit="kcal"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 22a8 8 0 0 0 8-8" />
                <path d="M20 10c0-4.4-3.6-8-8-8s-8 3.6-8 8 3.6 8 8 8" />
                <path d="M12 2v20" />
                <path d="M2 10h20" />
              </svg>
            }
            description={
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{todayStats.calories.burned} burned</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {todayStats.calories.goal - todayStats.calories.consumed + todayStats.calories.burned} remaining
                </span>
              </div>
            }
          />
          <MetricCard
            title="Water"
            value={todayStats.water.consumed}
            goal={todayStats.water.goal}
            unit="glasses"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v1" />
                <path d="M20.4 7.5A9 9 0 0 0 12 3a9 9 0 0 0-8.4 4.5" />
                <path d="M12 12a3 3 0 0 0-3 3c0 3 4 6 6 8.5 2-2.5 6-5.5 6-8.5a3 3 0 0 0-3-3" />
              </svg>
            }
            description={
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {Math.max(0, todayStats.water.goal - todayStats.water.consumed)} more to go
                </span>
              </div>
            }
          />
          <MetricCard
            title="Steps"
            value={todayStats.steps.count}
            goal={todayStats.steps.goal}
            unit="steps"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M19 5.5V13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5.5" />
                <path d="M2 5.5A2.5 2.5 0 0 1 4.5 3h15A2.5 2.5 0 0 1 22 5.5" />
                <path d="M14 13V5.5" />
                <path d="M10 13V5.5" />
              </svg>
            }
            description={
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {Math.round((todayStats.steps.count / todayStats.steps.goal) * 100)}% of daily goal
                </span>
              </div>
            }
          />
          <MetricCard
            title="Sleep"
            value={todayStats.sleep.hours}
            goal={todayStats.sleep.goal}
            unit="hours"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2" />
                <path d="M12 6v6l4 2" />
              </svg>
            }
            description={
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Quality: {todayStats.sleep.quality}/10</span>
              </div>
            }
          />
        </div>

        <Tabs defaultValue="diet" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="diet">Diet</TabsTrigger>
            <TabsTrigger value="exercise">Exercise</TabsTrigger>
            <TabsTrigger value="sleep">Sleep</TabsTrigger>
          </TabsList>
          <TabsContent value="diet" className="mt-6">
            <DietTracker stats={todayStats} updateStats={updateStats} />
          </TabsContent>
          <TabsContent value="exercise" className="mt-6">
            <ExerciseTracker stats={todayStats} updateStats={updateStats} />
          </TabsContent>
          <TabsContent value="sleep" className="mt-6">
            <SleepTracker stats={todayStats} updateStats={updateStats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

