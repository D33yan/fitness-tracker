export interface DailyStats {
  [date: string]: {
    calories: {
      consumed: number
      burned: number
      goal: number
    }
    water: {
      consumed: number
      goal: number
    }
    steps: {
      count: number
      goal: number
    }
    sleep: {
      hours: number
      quality: number
      goal: number
    }
    workouts: {
      completed: number
      goal: number
    }
  }
}

export const initialStats: DailyStats = {}

