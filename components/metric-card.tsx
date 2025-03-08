import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { ReactNode } from "react"

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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
        </div>
        {description && <CardDescription className="mt-1">{description}</CardDescription>}
        <Progress value={progress} className="mt-3 h-2" />
      </CardContent>
    </Card>
  )
}

