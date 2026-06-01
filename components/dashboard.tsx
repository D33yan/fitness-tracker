"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Flame, User, Compass } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import MetricCard from "@/components/metric-card"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { type DailyStats, initialStats } from "@/lib/types"
import dynamic from "next/dynamic"

const DietTracker = dynamic(() => import("@/components/diet-tracker"), { ssr: false })
const ExerciseTracker = dynamic(() => import("@/components/exercise-tracker"), { ssr: false })
const SleepTracker = dynamic(() => import("@/components/sleep-tracker"), { ssr: false })

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
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden pb-12">
      {/* Ambient background glowing blob */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[400px] bg-[#1D9E75]/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute -top-[100px] left-0 h-[300px] w-[300px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none -z-10" />

      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between py-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ rotate: -15, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <div className="rounded-xl bg-[#1D9E75] p-2 text-white shadow-md shadow-[#1D9E75]/20">
                <Compass className="h-5 w-5 animate-pulse" />
              </div>
            </motion.div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                FitTrack
              </h1>
              <p className="text-[10px] text-muted-foreground font-semibold tracking-wider uppercase -mt-0.5">
                Elevate Health
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            {/* Flame streak count pill */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full px-2.5 py-1 text-xs font-semibold"
            >
              <Flame className="h-3.5 w-3.5 fill-amber-500 animate-bounce" />
              <span>3 days</span>
            </motion.div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 h-9 px-3 text-xs rounded-full border-muted bg-card hover:bg-accent font-medium">
                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{format(date, "MMM d, yyyy")}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border rounded-2xl shadow-lg mt-2" align="end">
                <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
              </PopoverContent>
            </Popover>

            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] hover:bg-[#1D9E75]/20">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 px-4 sm:px-6 max-w-5xl">
        {/* Welcome message section */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
            {format(date, "EEEE, MMMM d")}
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
            Good morning, <span className="bg-gradient-to-r from-[#1D9E75] to-[#15825f] bg-clip-text text-transparent">Navie</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Let's smash your nutritional targets and hydration stats today.
          </p>
        </motion.div>

        {/* Dashboard Core Metrics Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
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
                className="h-4 w-4"
              >
                <path d="M12 22a8 8 0 0 0 8-8" />
                <path d="M20 10c0-4.4-3.6-8-8-8s-8 3.6-8 8 3.6 8 8 8" />
                <path d="M12 2v20" />
                <path d="M2 10h20" />
              </svg>
            }
            description={
              <div className="flex items-center gap-2">
                <span>{todayStats.calories.burned} burned</span>
                <span>•</span>
                <span>
                  {Math.max(0, todayStats.calories.goal - todayStats.calories.consumed + todayStats.calories.burned)} left
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
                className="h-4 w-4"
              >
                <path d="M12 2v1" />
                <path d="M20.4 7.5A9 9 0 0 0 12 3a9 9 0 0 0-8.4 4.5" />
                <path d="M12 12a3 3 0 0 0-3 3c0 3 4 6 6 8.5 2-2.5 6-5.5 6-8.5a3 3 0 0 0-3-3" />
              </svg>
            }
            description={
              <span>{Math.max(0, todayStats.water.goal - todayStats.water.consumed)} more to drink</span>
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
                className="h-4 w-4"
              >
                <path d="M19 5.5V13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5.5" />
                <path d="M2 5.5A2.5 2.5 0 0 1 4.5 3h15A2.5 2.5 0 0 1 22 5.5" />
                <path d="M14 13V5.5" />
                <path d="M10 13V5.5" />
              </svg>
            }
            description={
              <span>{Math.round((todayStats.steps.count / todayStats.steps.goal) * 100)}% of goal</span>
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
                className="h-4 w-4"
              >
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2" />
                <path d="M12 6v6l4 2" />
              </svg>
            }
            description={
              <span>Quality score: {todayStats.sleep.quality}/10</span>
            }
          />
        </div>

        {/* Feature section trackers using gorgeous tabs */}
        <Tabs defaultValue="diet" className="mt-10 sm:mt-12">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto bg-muted/60 p-1 rounded-full border border-border/50">
            <TabsTrigger value="diet" className="rounded-full py-2 font-semibold text-xs transition-all duration-300">
              Diet
            </TabsTrigger>
            <TabsTrigger value="exercise" className="rounded-full py-2 font-semibold text-xs transition-all duration-300">
              Exercise
            </TabsTrigger>
            <TabsTrigger value="sleep" className="rounded-full py-2 font-semibold text-xs transition-all duration-300">
              Sleep
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diet" className="mt-8">
            <DietTracker stats={todayStats} updateStats={updateStats} dateKey={dateKey} />
          </TabsContent>
          
          <TabsContent value="exercise" className="mt-8">
            <ExerciseTracker stats={todayStats} updateStats={updateStats} />
          </TabsContent>
          
          <TabsContent value="sleep" className="mt-8">
            <SleepTracker stats={todayStats} updateStats={updateStats} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
