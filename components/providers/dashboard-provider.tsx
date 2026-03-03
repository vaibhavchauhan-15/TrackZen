'use client'

import { createContext, useContext, ReactNode, useCallback } from 'react'
import useSWR from 'swr'

const DASHBOARD_API = '/api/dashboard'

// ── Types ────────────────────────────────────────────────────────────────────

export interface DashboardStreak {
  current: number
  longest: number
  lastActiveDate: string | null
}

export interface DashboardAnalytics {
  weeklyStudyHours: number
  habitsCompletedToday: number
  remainingExamDays: number | null
}

export interface DashboardTopic {
  id: string
  title: string
  subtopicTitle: string | null
  planTitle: string
  priority: string
  estimatedHours: number
}

export interface DashboardPlan {
  id: string
  title: string
  status: string
  endDate: string | null
  color: string
  progress: number
}

export interface DashboardHabit {
  id: string
  title: string
  color: string
  icon: string
  todayStatus: 'done' | 'missed' | 'skipped' | null
}

export interface DashboardRecentHabit {
  id: string
  title: string
  color: string
  icon: string
}

export interface DashboardData {
  streak: DashboardStreak
  analytics: DashboardAnalytics
  plannerOverview: {
    todaysTopics: DashboardTopic[]
    recentPlans: DashboardPlan[]
  }
  habitOverview: {
    todaysHabits: DashboardHabit[]
    recentHabits: DashboardRecentHabit[]
  }
}

interface DashboardContextType {
  data: DashboardData | null
  loading: boolean
  error: any
  refetch: () => Promise<void>
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

// ── Fetcher ───────────────────────────────────────────────────────────────

const dashboardFetcher = async (url: string): Promise<DashboardData> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch dashboard')
  return res.json()
}

// ── Provider ──────────────────────────────────────────────────────────────

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { data, error, isLoading, mutate: mutateDashboard } = useSWR<DashboardData>(
    DASHBOARD_API,
    dashboardFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 60000,
      dedupingInterval: 2000,
      keepPreviousData: true,
    },
  )

  const refetch = useCallback(async () => {
    await mutateDashboard()
  }, [mutateDashboard])

  return (
    <DashboardContext.Provider
      value={{
        data: data ?? null,
        loading: isLoading,
        error,
        refetch,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) throw new Error('useDashboard must be used within a DashboardProvider')
  return context
}
