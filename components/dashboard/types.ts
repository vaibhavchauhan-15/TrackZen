export interface DashboardStats {
  streak: number
  weeklyHours: number
  habitsCompleted: number
  totalHabits: number
  nextExamDays: number | null
}

export interface Task {
  id: string
  title: string
  estimatedHours: number
  completed: boolean
  priority: string
  planTitle?: string
}

export interface Plan {
  id: string
  title: string
  type: string
  completion: number
  color?: string
  endDate?: string
}

export interface HabitSummary {
  id: string
  title: string
  completed: boolean
  color?: string
}
