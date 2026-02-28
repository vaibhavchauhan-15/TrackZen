'use client'

import useSWR, { mutate, SWRConfiguration } from 'swr'
import useSWRMutation from 'swr/mutation'

// ========================
// FETCHER FUNCTIONS
// ========================
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    const data = await res.json().catch(() => ({}))
    ;(error as any).info = data
    ;(error as any).status = res.status
    throw error
  }
  return res.json()
}

const postFetcher = async (url: string, { arg }: { arg: any }) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  })
  if (!res.ok) {
    const error = new Error('An error occurred')
    const data = await res.json().catch(() => ({}))
    ;(error as any).info = data
    ;(error as any).status = res.status
    throw error
  }
  return res.json()
}

const putFetcher = async (url: string, { arg }: { arg: any }) => {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  })
  if (!res.ok) {
    const error = new Error('An error occurred')
    const data = await res.json().catch(() => ({}))
    ;(error as any).info = data
    ;(error as any).status = res.status
    throw error
  }
  return res.json()
}

const deleteFetcher = async (url: string) => {
  const res = await fetch(url, { method: 'DELETE' })
  if (!res.ok) {
    const error = new Error('An error occurred')
    const data = await res.json().catch(() => ({}))
    ;(error as any).info = data
    ;(error as any).status = res.status
    throw error
  }
  return res.json()
}

// ========================
// API KEYS (for cache management)
// ========================
export const API_KEYS = {
  dashboard: '/api/dashboard',
  plans: '/api/plans',
  plan: (id: string) => `/api/plans/${id}`,
  habits: '/api/habits',
  habit: (id: string) => `/api/habits/${id}`,
  habitLog: (id: string) => `/api/habits/${id}/log`,
  user: '/api/user',
  progress: '/api/progress',
  topics: '/api/topics',
}

// ========================
// CACHE INVALIDATION HELPERS
// ========================
export const revalidateDashboard = () => mutate(API_KEYS.dashboard)
export const revalidatePlans = () => mutate(API_KEYS.plans)
export const revalidatePlan = (id: string) => mutate(API_KEYS.plan(id))
export const revalidateHabits = () => mutate(API_KEYS.habits)
export const revalidateAll = () => {
  mutate(API_KEYS.dashboard)
  mutate(API_KEYS.plans)
  mutate(API_KEYS.habits)
}

// ========================
// DASHBOARD HOOKS
// ========================
export function useDashboardData(config?: SWRConfiguration) {
  return useSWR(API_KEYS.dashboard, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 30000, // 30s auto-refresh
    dedupingInterval: 5000, // 5s deduplication
    keepPreviousData: true,
    ...config,
  })
}

// ========================
// PLANS HOOKS
// ========================
export function usePlans(config?: SWRConfiguration) {
  return useSWR(API_KEYS.plans, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000, // 60s auto-refresh
    dedupingInterval: 5000,
    keepPreviousData: true,
    ...config,
  })
}

export function usePlan(planId: string | null, config?: SWRConfiguration) {
  return useSWR(planId ? API_KEYS.plan(planId) : null, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000,
    dedupingInterval: 5000,
    keepPreviousData: true,
    ...config,
  })
}

export function useCreatePlan() {
  return useSWRMutation(API_KEYS.plans, postFetcher, {
    onSuccess: () => {
      revalidatePlans()
      revalidateDashboard()
    },
  })
}

export function useUpdatePlan(planId: string) {
  return useSWRMutation(API_KEYS.plan(planId), putFetcher, {
    onSuccess: () => {
      revalidatePlan(planId)
      revalidatePlans()
      revalidateDashboard()
    },
  })
}

export function useDeletePlan(planId: string) {
  return useSWRMutation(
    API_KEYS.plan(planId),
    () => deleteFetcher(API_KEYS.plan(planId)),
    {
      onSuccess: () => {
        revalidatePlans()
        revalidateDashboard()
      },
    }
  )
}

// ========================
// TOPICS HOOKS
// ========================
export function useUpdateTopicStatus(planId: string) {
  return useSWRMutation(
    `/api/topics/status`,
    async (url: string, { arg }: { arg: { topicId: string; status: string } }) => {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      })
      if (!res.ok) throw new Error('Failed to update topic')
      return res.json()
    },
    {
      onSuccess: () => {
        revalidatePlan(planId)
        revalidateDashboard()
      },
    }
  )
}

// ========================
// HABITS HOOKS
// ========================
export function useHabits(config?: SWRConfiguration) {
  return useSWR(API_KEYS.habits, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 30000,
    dedupingInterval: 5000,
    keepPreviousData: true,
    ...config,
  })
}

export function useHabit(habitId: string | null, config?: SWRConfiguration) {
  return useSWR(habitId ? API_KEYS.habit(habitId) : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    keepPreviousData: true,
    ...config,
  })
}

export function useCreateHabit() {
  return useSWRMutation(API_KEYS.habits, postFetcher, {
    onSuccess: () => {
      revalidateHabits()
      revalidateDashboard()
    },
  })
}

export function useUpdateHabit(habitId: string) {
  return useSWRMutation(API_KEYS.habit(habitId), putFetcher, {
    onSuccess: () => {
      revalidateHabits()
      revalidateDashboard()
    },
  })
}

export function useDeleteHabit(habitId: string) {
  return useSWRMutation(
    API_KEYS.habit(habitId),
    () => deleteFetcher(API_KEYS.habit(habitId)),
    {
      onSuccess: () => {
        revalidateHabits()
        revalidateDashboard()
      },
    }
  )
}

// Habit toggle with optimistic update
export function useToggleHabit() {
  return useSWRMutation(
    'toggle-habit',
    async (url: string, { arg }: { arg: { habitId: string; date?: string } }) => {
      const { habitId, date } = arg
      const logDate = date || new Date().toISOString().split('T')[0]
      
      const res = await fetch(`/api/habits/${habitId}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: logDate }),
      })
      if (!res.ok) throw new Error('Failed to toggle habit')
      return res.json()
    },
    {
      onSuccess: () => {
        revalidateHabits()
        revalidateDashboard()
      },
    }
  )
}

// ========================
// USER HOOKS
// ========================
export function useUser(config?: SWRConfiguration) {
  return useSWR(API_KEYS.user, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1min deduplication for user data
    keepPreviousData: true,
    ...config,
  })
}

// ========================
// PROGRESS HOOKS
// ========================
export function useProgress(config?: SWRConfiguration) {
  return useSWR(API_KEYS.progress, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 120000, // 2min refresh for analytics
    dedupingInterval: 10000,
    keepPreviousData: true,
    ...config,
  })
}

// ========================
// AI GENERATION HOOK
// ========================
export function useGeneratePlan() {
  return useSWRMutation(
    '/api/ai/generate-plan',
    postFetcher,
    {
      onSuccess: () => {
        revalidatePlans()
        revalidateDashboard()
      },
    }
  )
}
