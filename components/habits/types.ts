export interface Habit {
  id: string
  userId?: string
  title: string
  description: string | null
  icon: string
  category: string
  frequency: 'daily' | 'weekly' | 'monthly'
  priority: number // 1 = high, 2 = medium, 3 = low
  targetDays?: number[] | null
  timeSlot?: string | null
  color: string
  currentStreak: number
  longestStreak?: number
  isActive: boolean
  createdAt: string
}

export interface HabitLog {
  id: string
  habitId: string
  userId?: string
  date: string
  status: 'done' | 'skipped' | 'missed'
  note?: string | null
}

export type FrequencyTab = 'daily' | 'weekly' | 'monthly'

export interface HabitStats {
  completionRate: number
  bestStreak: number
  totalCompleted: number
  activeCount: number
  remainingToday: number
}
