"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Moon, Sun, Bed, Sparkles, CheckCircle2 } from "lucide-react"
import type { DailyStats } from "@/lib/types"

interface SleepTrackerProps {
  stats: DailyStats[string]
  updateStats: (newStats: DailyStats[string]) => void
}

export default function SleepTracker({ stats, updateStats }: SleepTrackerProps) {
  const [bedTime, setBedTime] = useState("22:00")
  const [wakeTime, setWakeTime] = useState("06:00")

  const calculateSleepHours = (bedTime: string, wakeTime: string) => {
    const [bedHours, bedMinutes] = bedTime.split(":").map(Number)
    const [wakeHours, wakeMinutes] = wakeTime.split(":").map(Number)

    let hours = wakeHours - bedHours
    let minutes = wakeMinutes - bedMinutes

    if (hours < 0) hours += 24
    if (minutes < 0) {
      minutes += 60
      hours -= 1
    }

    return hours + minutes / 60
  }

  const updateSleepHours = () => {
    const hours = calculateSleepHours(bedTime, wakeTime)
    updateStats({
      ...stats,
      sleep: {
        ...stats.sleep,
        hours,
      },
    })
  }

  const updateSleepQuality = (quality: number) => {
    updateStats({
      ...stats,
      sleep: {
        ...stats.sleep,
        quality,
      },
    })
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="glass-card shadow-none border-border">
        <CardHeader>
          <CardTitle>Sleep Duration</CardTitle>
          <CardDescription>Track your sleep schedule</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center">
            <div className="relative mb-6 h-40 w-40">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsla(var(--muted-foreground), 0.1)" strokeWidth="8" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#7F77DD"
                  strokeWidth="8"
                  strokeDasharray="282.7"
                  strokeDashoffset={282.7 - 282.7 * (stats.sleep.hours / stats.sleep.goal)}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 282.7 }}
                  animate={{ strokeDashoffset: 282.7 - 282.7 * (stats.sleep.hours / stats.sleep.goal) }}
                  transition={{ duration: 1 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold tracking-tight text-[#7F77DD]">
                  {stats.sleep.hours.toFixed(1)}
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mt-0.5">
                  of {stats.sleep.goal} hours
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4 border-border">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bed-time" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bed Time</Label>
                  <Moon className="h-3.5 w-3.5 text-[#7F77DD]" />
                </div>
                <Input id="bed-time" type="time" value={bedTime} onChange={(e) => setBedTime(e.target.value)} className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="wake-time" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wake Time</Label>
                  <Sun className="h-3.5 w-3.5 text-[#EF9F27]" />
                </div>
                <Input id="wake-time" type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="bg-background/50" />
              </div>
            </div>
            <Button onClick={updateSleepHours} className="w-full bg-[#7F77DD] hover:bg-[#5248b8] text-white border-none mt-2">
              Update Sleep Hours
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card shadow-none border-border">
        <CardHeader>
          <CardTitle>Sleep Quality</CardTitle>
          <CardDescription>Rate how well you slept</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center py-2">
            <div className="rounded-full bg-[#7F77DD]/10 p-4 text-[#7F77DD] mb-4">
              <Bed className="h-10 w-10" />
            </div>
            <div className="text-center mb-6">
              <h3 className="text-3xl font-extrabold tracking-tight text-[#7F77DD]">{stats.sleep.quality}/10</h3>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1.5 flex items-center gap-1.5 justify-center">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                <span>
                  {stats.sleep.quality < 4
                    ? "Poor Sleep"
                    : stats.sleep.quality < 7
                      ? "Average Sleep"
                      : "Excellent Sleep"}
                </span>
              </p>
            </div>
            <div className="w-full max-w-sm space-y-3 bg-muted/30 p-4 rounded-2xl border border-border/50">
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <span>Poor</span>
                <span>Excellent</span>
              </div>
              <Slider
                value={[stats.sleep.quality]}
                min={0}
                max={10}
                step={1}
                onValueChange={(value) => updateSleepQuality(value[0])}
                className="py-1 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                <span>0</span>
                <span>10</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t pt-4 border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sleep Science Tips</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <li className="flex items-start gap-2 bg-[#7F77DD]/5 p-2.5 rounded-xl border border-[#7F77DD]/10">
                <CheckCircle2 className="h-4 w-4 text-[#7F77DD] flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground font-medium leading-normal">Aim for 7-9 hours of regular sleep nightly.</span>
              </li>
              <li className="flex items-start gap-2 bg-[#7F77DD]/5 p-2.5 rounded-xl border border-[#7F77DD]/10">
                <CheckCircle2 className="h-4 w-4 text-[#7F77DD] flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground font-medium leading-normal">Keep a highly consistent bedtime routine.</span>
              </li>
              <li className="flex items-start gap-2 bg-[#7F77DD]/5 p-2.5 rounded-xl border border-[#7F77DD]/10">
                <CheckCircle2 className="h-4 w-4 text-[#7F77DD] flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground font-medium leading-normal">Avoid device screens 1 hr before hitting bed.</span>
              </li>
              <li className="flex items-start gap-2 bg-[#7F77DD]/5 p-2.5 rounded-xl border border-[#7F77DD]/10">
                <CheckCircle2 className="h-4 w-4 text-[#7F77DD] flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground font-medium leading-normal">Dim lighting & maintain cool room temperature.</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
