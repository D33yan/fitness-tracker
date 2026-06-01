"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReactNode } from "react"
import { motion } from "framer-motion"

interface MetricCardProps {
  title: string
  value: number
  goal: number
  unit: string
  icon: ReactNode
  description?: ReactNode
}

export default function MetricCard({ title, value, goal, unit, icon, description }: MetricCardProps) {
  const progress = Math.min(100, (value / goal) * 100)

  // Curate premium design tokens based on card type
  const getThemeDetails = () => {
    switch (title.toLowerCase()) {
      case "calories":
        return {
          cardClass: "gradient-card-brand text-white border-none",
          barClass: "bg-emerald-200/40",
          indicatorColor: "bg-white",
          accentText: "text-emerald-100",
        }
      case "water":
        return {
          cardClass: "gradient-card-water text-white border-none",
          barClass: "bg-blue-200/40",
          indicatorColor: "bg-white",
          accentText: "text-blue-100",
        }
      case "steps":
        return {
          cardClass: "gradient-card-steps text-white border-none",
          barClass: "bg-amber-200/40",
          indicatorColor: "bg-white",
          accentText: "text-amber-100",
        }
      case "sleep":
        return {
          cardClass: "gradient-card-sleep text-white border-none",
          barClass: "bg-violet-200/40",
          indicatorColor: "bg-white",
          accentText: "text-violet-100",
        }
      default:
        return {
          cardClass: "glass-card hover-card-trigger",
          barClass: "bg-muted",
          indicatorColor: "bg-primary",
          accentText: "text-muted-foreground",
        }
    }
  }

  const theme = getThemeDetails()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className={`h-full overflow-hidden hover-card-trigger transition-all duration-300 ${theme.cardClass}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold tracking-wider uppercase opacity-90">{title}</CardTitle>
          <div className="rounded-full bg-white/20 p-2 text-white">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-extrabold tracking-tight">
            {title.toLowerCase() === "steps" ? value.toLocaleString() : value}{" "}
            <span className="text-xs font-normal opacity-85 tracking-wide">{unit}</span>
          </div>
          {description && (
            <div className={`mt-1.5 text-xs font-medium ${theme.accentText}`}>
              {description}
            </div>
          )}
          
          {/* Customized beautiful modern progress bar */}
          <div className={`mt-4 w-full h-1.5 rounded-full overflow-hidden ${theme.barClass}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${theme.indicatorColor}`}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
