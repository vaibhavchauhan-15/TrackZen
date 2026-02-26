'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useDashboardData } from '@/lib/hooks/use-swr-api'
import { mutate } from 'swr'

interface DashboardData {
  user: {
    name: string | null
    email: string | null
    image: string | null
  }
  streak: number
  plans: any[]
  activePlans: any[]
  habits: any[]
  todayLogs: Record<string, any>
  habitsCompleted: number
  summary: {
    streak: number
    todayTasks: any[]
    todayHabits: any[]
    activePlans: any[]
    weeklyHours: number
    habitsCompleted: number
    nextExamDays: number | null
  }
}

interface DashboardContextType {
  data: DashboardData | null
  loading: boolean
  error: any
  refetch: () => Promise<void>
  updatePlans: (plans: any[]) => void
  updateHabits: (habits: any[], logs: Record<string, any>) => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: ReactNode }) {
  // Use SWR for automatic caching, deduplication, and revalidation
  const { data, error, isLoading, mutate: revalidate } = useDashboardData()

  const refetch = async () => {
    await revalidate()
  }

  const updatePlans = (plans: any[]) => {
    if (data) {
      const updatedData = {
        ...data,
        plans,
        activePlans: plans.filter((p) => p.status === 'active').slice(0, 3),
      }
      // Optimistic update
      mutate('/api/dashboard/initial', updatedData, false)
    }
  }

  const updateHabits = (habits: any[], logs: Record<string, any>) => {
    if (data) {
      const habitsCompleted = Object.values(logs).filter((log) => log.status === 'done').length
      const updatedData = {
        ...data,
        habits,
        todayLogs: logs,
        habitsCompleted,
      }
      // Optimistic update
      mutate('/api/dashboard/initial', updatedData, false)
    }
  }

  return (
    <DashboardContext.Provider
      value={{
        data: (data as DashboardData) || null,
        loading: isLoading,
        error,
        refetch,
        updatePlans,
        updateHabits,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}
