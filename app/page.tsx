import type { Metadata } from "next"
import Dashboard from "@/components/dashboard"

export const metadata: Metadata = {
  title: "FitTrack | Your Complete Fitness Tracker",
  description: "Track your diet, exercise, and sleep patterns all in one place",
}

export default function Home() {
  return (
    <main>
      <Dashboard />
    </main>
  )
}

