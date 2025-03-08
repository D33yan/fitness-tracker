"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Moon, Sun, Bed } from "lucide-react"
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
      <Card>
        <CardHeader>
          <CardTitle>Sleep Duration</CardTitle>
          <CardDescription>Track your sleep schedule</CardDescription>
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
                  stroke="#8b5cf6"
                  strokeWidth="10"
                  strokeDasharray="282.7"
                  strokeDashoffset={282.7 - 282.7 * (stats.sleep.hours / stats.sleep.goal)}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 282.7 }}
                  animate={{ strokeDashoffset: 282.7 - 282.7 * (stats.sleep.hours / stats.sleep.goal) }}
                  transition={{ duration: 1 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{stats.sleep.hours.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">of {stats.sleep.goal} hours</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bed-time">Bed Time</Label>
                  <Moon className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input id="bed-time" type="time" value={bedTime} onChange={(e) => setBedTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="wake-time">Wake Time</Label>
                  <Sun className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input id="wake-time" type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
              </div>
            </div>
            <Button onClick={updateSleepHours} className="w-full">
              Update Sleep Hours
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sleep Quality</CardTitle>
          <CardDescription>Rate how well you slept</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center py-6">
            <Bed className="h-16 w-16 text-primary/50 mb-4" />
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold">{stats.sleep.quality}/10</h3>
              <p className="text-sm text-muted-foreground">
                {stats.sleep.quality < 4
                  ? "Poor sleep quality"
                  : stats.sleep.quality < 7
                    ? "Average sleep quality"
                    : "Excellent sleep quality"}
              </p>
            </div>
            <div className="w-full max-w-md space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Poor</span>
                <span className="text-sm">Excellent</span>
              </div>
              <Slider
                value={[stats.sleep.quality]}
                min={0}
                max={10}
                step={1}
                onValueChange={(value) => updateSleepQuality(value[0])}
              />
              <div className="flex justify-between">
                <span className="text-sm">0</span>
                <span className="text-sm">10</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Sleep Tips</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <div className="mr-2 mt-0.5 h-2 w-2 rounded-full bg-primary" />
                <span>Aim for 7-9 hours of sleep each night</span>
              </li>
              <li className="flex items-start">
                <div className="mr-2 mt-0.5 h-2 w-2 rounded-full bg-primary" />
                <span>Keep a consistent sleep schedule</span>
              </li>
              <li className="flex items-start">
                <div className="mr-2 mt-0.5 h-2 w-2 rounded-full bg-primary" />
                <span>Avoid screens 1 hour before bedtime</span>
              </li>
              <li className="flex items-start">
                <div className="mr-2 mt-0.5 h-2 w-2 rounded-full bg-primary" />
                <span>Create a relaxing bedtime routine</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

