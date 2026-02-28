'use client'

import { createContext, useContext, ReactNode, useCallback } from 'react'
import useSWR, { mutate } from 'swr'

// Define API endpoints locally to avoid import issues
const DASHBOARD_API = '/api/dashboard'
const HABITS_API = '/api/habits'

// Local revalidation helpers
const revalidateDashboard = () => mutate(DASHBOARD_API)
const revalidateHabits = () => mutate(HABITS_API)

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
  toggleHabit: (habitId: string, date?: string) => Promise<void>
  updateTopicStatus: (topicId: string, status: string) => Promise<void>
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

// Fetcher for dashboard data
const dashboardFetcher = async (url: string): Promise<DashboardData> => {
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    throw new Error('Failed to fetch dashboard')
  }

  return res.json()
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  // Use SWR for data fetching with caching
  const { data, error, isLoading, mutate: mutateDashboard } = useSWR<DashboardData>(
    DASHBOARD_API,
    dashboardFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // 30s auto-refresh
      dedupingInterval: 5000, // 5s deduplication
      keepPreviousData: true,
    }
  )

  const refetch = useCallback(async () => {
    await mutateDashboard()
  }, [mutateDashboard])

  // Update plans with optimistic update
  const updatePlans = useCallback((plans: any[]) => {
    mutateDashboard((current) => {
      if (!current) return current
      return {
        ...current,
        plans,
        activePlans: plans.filter((p) => p.status === 'active').slice(0, 3),
      }
    }, false) // false = don't revalidate, just update cache
  }, [mutateDashboard])

  // Update habits with optimistic update
  const updateHabits = useCallback((habits: any[], logs: Record<string, any>) => {
    mutateDashboard((current) => {
      if (!current) return current
      const habitsCompleted = Object.values(logs).filter((log) => log.status === 'done').length
      return {
        ...current,
        habits,
        todayLogs: logs,
        habitsCompleted,
        summary: {
          ...current.summary,
          habitsCompleted,
        },
      }
    }, false)
  }, [mutateDashboard])

  // Optimistic habit toggle with SWR
  const toggleHabit = useCallback(async (habitId: string, date?: string) => {
    const logDate = date || new Date().toISOString().split('T')[0]
    
    // Optimistic update
    await mutateDashboard((current) => {
      if (!current) return current
      const currentStatus = current.todayLogs[habitId]?.status
      const newStatus = currentStatus === 'done' ? 'missed' : 'done'
      const newLogs = {
        ...current.todayLogs,
        [habitId]: { ...current.todayLogs[habitId], status: newStatus, habitId, date: logDate },
      }
      const habitsCompleted = Object.values(newLogs).filter((log: any) => log.status === 'done').length
      return {
        ...current,
        todayLogs: newLogs,
        habitsCompleted,
        summary: { ...current.summary, habitsCompleted },
      }
    }, false)

    // Make API call
    try {
      const res = await fetch(`/api/habits/${habitId}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: logDate }),
      })

      if (!res.ok) {
        throw new Error('Failed to toggle habit')
      }

      // Update with server response
      const result = await res.json()
      mutateDashboard((current) => {
        if (!current) return current
        const newLogs = {
          ...current.todayLogs,
          [habitId]: result.log,
        }
        const habitsCompleted = Object.values(newLogs).filter((log: any) => log.status === 'done').length
        
        // Update habit streak in habits array
        const updatedHabits = current.habits.map(h => 
          h.id === habitId 
            ? { ...h, currentStreak: result.streak.current, longestStreak: result.streak.longest }
            : h
        )
        
        return {
          ...current,
          habits: updatedHabits,
          todayLogs: newLogs,
          habitsCompleted,
          summary: { ...current.summary, habitsCompleted },
        }
      }, false)
      
      // Also revalidate habits cache
      revalidateHabits()
    } catch (err) {
      console.error('Toggle habit error:', err)
      // Revert on error - revalidate to get fresh data
      mutateDashboard()
      throw err
    }
  }, [mutateDashboard])

  // Optimistic topic status update
  const updateTopicStatus = useCallback(async (topicId: string, status: string) => {
    try {
      const res = await fetch(`/api/topics/${topicId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) {
        throw new Error('Failed to update topic')
      }

      // Revalidate dashboard to get updated data
      await mutateDashboard()
    } catch (err) {
      console.error('Update topic error:', err)
      throw err
    }
  }, [mutateDashboard])

  return (
    <DashboardContext.Provider
      value={{
        data: data || null,
        loading: isLoading,
        error,
        refetch,
        updatePlans,
        updateHabits,
        toggleHabit,
        updateTopicStatus,
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
