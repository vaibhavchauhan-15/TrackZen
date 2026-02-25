'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

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
  error: string | null
  refetch: () => Promise<void>
  updatePlans: (plans: any[]) => void
  updateHabits: (habits: any[], logs: Record<string, any>) => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/dashboard/initial')
      if (!res.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const updatePlans = (plans: any[]) => {
    if (data) {
      setData({
        ...data,
        plans,
        activePlans: plans.filter((p) => p.status === 'active').slice(0, 3),
      })
    }
  }

  const updateHabits = (habits: any[], logs: Record<string, any>) => {
    if (data) {
      const habitsCompleted = Object.values(logs).filter((log) => log.status === 'done').length
      setData({
        ...data,
        habits,
        todayLogs: logs,
        habitsCompleted,
      })
    }
  }

  return (
    <DashboardContext.Provider
      value={{
        data,
        loading,
        error,
        refetch: fetchData,
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
