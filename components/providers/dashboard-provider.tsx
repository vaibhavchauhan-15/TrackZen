'use client'

import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useRef } from 'react'

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

// Stale-while-revalidate cache
const CACHE_KEY = 'dashboard_cache'
const CACHE_DURATION = 30 * 1000 // 30 seconds

function getCache(): { data: DashboardData | null; timestamp: number } | null {
  if (typeof window === 'undefined') return null
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch {}
  return null
}

function setCache(data: DashboardData) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
  } catch {}
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const fetchingRef = useRef(false)

  const fetchDashboard = useCallback(async (showLoading = true) => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    
    if (showLoading) setLoading(true)
    
    try {
      const res = await fetch('/api/dashboard', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      })

      if (!res.ok) {
        throw new Error('Failed to fetch dashboard')
      }

      const result = await res.json()
      setData(result)
      setCache(result)
      setError(null)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [])

  // Initial load with SWR pattern
  useEffect(() => {
    // Check cache first
    const cached = getCache()
    if (cached?.data) {
      setData(cached.data)
      setLoading(false)
      
      // Revalidate in background if stale
      if (Date.now() - cached.timestamp > CACHE_DURATION) {
        fetchDashboard(false)
      }
    } else {
      fetchDashboard(true)
    }
  }, [fetchDashboard])

  const refetch = useCallback(async () => {
    await fetchDashboard(false)
  }, [fetchDashboard])

  const updatePlans = useCallback((plans: any[]) => {
    setData(prev => {
      if (!prev) return prev
      const updated = {
        ...prev,
        plans,
        activePlans: plans.filter((p) => p.status === 'active').slice(0, 3),
      }
      setCache(updated)
      return updated
    })
  }, [])

  const updateHabits = useCallback((habits: any[], logs: Record<string, any>) => {
    setData(prev => {
      if (!prev) return prev
      const habitsCompleted = Object.values(logs).filter((log) => log.status === 'done').length
      const updated = {
        ...prev,
        habits,
        todayLogs: logs,
        habitsCompleted,
        summary: {
          ...prev.summary,
          habitsCompleted,
        },
      }
      setCache(updated)
      return updated
    })
  }, [])

  // Optimistic habit toggle
  const toggleHabit = useCallback(async (habitId: string, date?: string) => {
    const logDate = date || new Date().toISOString().split('T')[0]
    
    // Optimistic update
    setData(prev => {
      if (!prev) return prev
      const currentStatus = prev.todayLogs[habitId]?.status
      const newStatus = currentStatus === 'done' ? 'missed' : 'done'
      const newLogs = {
        ...prev.todayLogs,
        [habitId]: { ...prev.todayLogs[habitId], status: newStatus, habitId, date: logDate },
      }
      const habitsCompleted = Object.values(newLogs).filter((log: any) => log.status === 'done').length
      return {
        ...prev,
        todayLogs: newLogs,
        habitsCompleted,
        summary: { ...prev.summary, habitsCompleted },
      }
    })

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
      setData(prev => {
        if (!prev) return prev
        const newLogs = {
          ...prev.todayLogs,
          [habitId]: result.log,
        }
        const habitsCompleted = Object.values(newLogs).filter((log: any) => log.status === 'done').length
        
        // Update habit streak in habits array
        const updatedHabits = prev.habits.map(h => 
          h.id === habitId 
            ? { ...h, currentStreak: result.streak.current, longestStreak: result.streak.longest }
            : h
        )
        
        const updated = {
          ...prev,
          habits: updatedHabits,
          todayLogs: newLogs,
          habitsCompleted,
          summary: { ...prev.summary, habitsCompleted },
        }
        setCache(updated)
        return updated
      })
    } catch (err) {
      console.error('Toggle habit error:', err)
      // Revert on error
      refetch()
    }
  }, [refetch])

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

      // Refetch to get updated data
      await refetch()
    } catch (err) {
      console.error('Update topic error:', err)
      throw err
    }
  }, [refetch])

  return (
    <DashboardContext.Provider
      value={{
        data,
        loading,
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
