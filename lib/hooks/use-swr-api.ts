'use client'

import { useCallback } from 'react'
import useSWR, { mutate, SWRConfiguration } from 'swr'
import useSWRMutation from 'swr/mutation'
import { useSWRConfig } from 'swr'

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

// Generic mutation fetcher — avoids duplicating POST/PUT/PATCH/DELETE logic
const mutationFetcher =
  (method: 'POST' | 'PUT' | 'PATCH' | 'DELETE') =>
  async (url: string, { arg }: { arg?: any } = {}) => {
    const res = await fetch(url, {
      method,
      headers: arg !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: arg !== undefined ? JSON.stringify(arg) : undefined,
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

const postFetcher  = mutationFetcher('POST')
const patchFetcher = mutationFetcher('PATCH')
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
    refreshInterval: 120000, // 2min — summary data; mutations will invalidate explicitly
    dedupingInterval: 10000, // 10s deduplication
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
  // API route uses PATCH — was incorrectly using PUT before
  return useSWRMutation(API_KEYS.plan(planId), patchFetcher, {
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

/**
 * Update a single topic's fields with optimistic update.
 * planId is used to revalidate the parent plan cache after success.
 */
export function useUpdateTopic(planId: string) {
  return useSWRMutation(
    API_KEYS.plan(planId),
    async (
      _key: string,
      { arg }: { arg: { topicId: string } & Record<string, any> },
    ) => {
      const { topicId, ...fields } = arg
      return patchFetcher(`/api/topics/${topicId}`, { arg: fields })
    },
    {
      // Optimistic: reflect status change immediately in the plan cache
      optimisticData: (currentData: any, arg: any) => {
        if (!currentData?.plan?.topics || !arg?.topicId) return currentData
        const { topicId, ...fields } = arg
        const patchTopics = (topicsList: any[]): any[] =>
          topicsList.map((t: any) => {
            if (t.id === topicId) return { ...t, ...fields }
            if (t.subtopics?.length)
              return { ...t, subtopics: patchTopics(t.subtopics) }
            return t
          })
        return {
          ...currentData,
          plan: {
            ...currentData.plan,
            topics: patchTopics(currentData.plan.topics),
          },
        }
      },
      rollbackOnError: true,
      revalidate: false, // use returned server data instead of re-fetching
      onSuccess: () => {
        revalidateDashboard()
      },
    },
  )
}

/** @deprecated use useUpdateTopic */
export function useUpdateTopicStatus(planId: string) {
  return useUpdateTopic(planId)
}

// ========================
// HABITS HOOKS
// ========================
export function useHabits(config?: SWRConfiguration) {
  return useSWR(API_KEYS.habits, fetcher, {
    revalidateOnFocus: false,
    // No polling — mutations explicitly revalidate to avoid 120 req/hr of wasted bandwidth
    refreshInterval: 0,
    dedupingInterval: 10000,
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
  return useSWRMutation(API_KEYS.habit(habitId), patchFetcher, {
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

// Habit toggle with optimistic update — instant UI response, rollback on error
export function useToggleHabit() {
  // Bound mutate — shares the custom SWR cache provider so optimistic data
  // lands in the same cache that useSWR reads from.
  const { mutate: boundMutate } = useSWRConfig()

  const toggle = useCallback(async (arg: { habitId: string; date?: string }) => {
    const { habitId, date } = arg
    const logDate = date || new Date().toISOString().split('T')[0]

    await boundMutate(
      API_KEYS.habits,
      async (currentData: any) => {
        const res = await fetch(`/api/habits/${habitId}/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: logDate }),
        })
        if (!res.ok) throw new Error('Failed to toggle habit')
        const result = await res.json()
        // result: { status: 'done' | null, streak: { currentStreak, longestStreak } | null }

        // Guard — if cache was empty, just revalidate instead of returning broken data
        if (!currentData) return currentData

        // Update todayLogs
        const newTodayLogs = { ...currentData.todayLogs }
        if (result.status) {
          newTodayLogs[habitId] = { habitId, date: logDate, status: result.status }
        } else {
          delete newTodayLogs[habitId]
        }

        // Update weeklyLogs — add or remove today's log entry
        const existingWeekly: any[] = currentData.weeklyLogs?.[habitId] ?? []
        let newWeeklyForHabit: any[]
        if (result.status) {
          const alreadyExists = existingWeekly.some((l: any) => l.date === logDate)
          newWeeklyForHabit = alreadyExists
            ? existingWeekly.map((l: any) =>
                l.date === logDate ? { ...l, status: result.status } : l
              )
            : [...existingWeekly, { habitId, date: logDate, status: result.status }]
        } else {
          newWeeklyForHabit = existingWeekly.filter((l: any) => l.date !== logDate)
        }

        // Update streak in habits array if server returned it
        let newHabits = currentData.habits ?? []
        if (result.streak) {
          newHabits = newHabits.map((h: any) =>
            h.id === habitId
              ? { ...h, currentStreak: result.streak.currentStreak, longestStreak: result.streak.longestStreak }
              : h
          )
        }

        return {
          ...currentData,
          habits: newHabits,
          todayLogs: newTodayLogs,
          weeklyLogs: {
            ...currentData.weeklyLogs,
            [habitId]: newWeeklyForHabit,
          },
        }
      },
      {
        // Optimistic: flip status immediately in both todayLogs and weeklyLogs
        optimisticData: (currentData: any) => {
          // Guard — if cache is empty, can't apply optimistic update
          if (!currentData) return currentData

          const isCurrentlyDone = currentData.todayLogs?.[habitId]?.status === 'done'

          // todayLogs update
          const todayLogs = { ...currentData.todayLogs }
          if (isCurrentlyDone) {
            delete todayLogs[habitId]
          } else {
            todayLogs[habitId] = { habitId, date: logDate, status: 'done' }
          }

          // weeklyLogs update
          const existingWeekly: any[] = currentData.weeklyLogs?.[habitId] ?? []
          let newWeeklyForHabit: any[]
          if (!isCurrentlyDone) {
            const alreadyExists = existingWeekly.some((l: any) => l.date === logDate)
            newWeeklyForHabit = alreadyExists
              ? existingWeekly.map((l: any) =>
                  l.date === logDate ? { ...l, status: 'done' } : l
                )
              : [...existingWeekly, { habitId, date: logDate, status: 'done' }]
          } else {
            newWeeklyForHabit = existingWeekly.filter((l: any) => l.date !== logDate)
          }

          // Optimistic streak bump/decrement
          const habits = (currentData.habits ?? []).map((h: any) => {
            if (h.id !== habitId) return h
            const newStreak = isCurrentlyDone
              ? Math.max(0, (h.currentStreak || 0) - 1)
              : (h.currentStreak || 0) + 1
            return { ...h, currentStreak: newStreak }
          })

          return {
            ...currentData,
            habits,
            todayLogs,
            weeklyLogs: {
              ...currentData.weeklyLogs,
              [habitId]: newWeeklyForHabit,
            },
          }
        },
        rollbackOnError: true,
        revalidate: false,
      },
    )

    // Revalidate only dashboard counters — NOT habits, because the mutate above
    // already patched the cache with revalidate:false. Calling boundMutate(habits)
    // immediately would race with the just-committed POST and could overwrite
    // the correct optimistic state with a stale DB read.
    boundMutate(API_KEYS.dashboard)
  }, [boundMutate])

  return { trigger: toggle }
}

// ========================
// USER HOOKS
// ========================
export function useUser(config?: SWRConfiguration) {
  return useSWR(API_KEYS.user, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 0,       // user data never changes without a PATCH
    dedupingInterval: 60000,  // 1min dedup
    keepPreviousData: true,
    ...config,
  })
}

export function useUpdateUser() {
  return useSWRMutation(API_KEYS.user, patchFetcher, {
    onSuccess: () => mutate(API_KEYS.user),
  })
}

// ========================
// PROGRESS HOOKS
// ========================
export function useProgress(startDate?: string, endDate?: string, planId?: string, config?: SWRConfiguration) {
  const params = new URLSearchParams()
  if (startDate) params.set('startDate', startDate)
  if (endDate) params.set('endDate', endDate)
  if (planId) params.set('planId', planId)
  const query = params.toString()
  const key = query ? `${API_KEYS.progress}?${query}` : API_KEYS.progress

  return useSWR(key, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 0,      // analytics don't change unless a POST is made
    dedupingInterval: 30000, // 30s dedup
    keepPreviousData: true,
    ...config,
  })
}

export function useLogProgress() {
  return useSWRMutation(API_KEYS.progress, postFetcher, {
    onSuccess: () => {
      mutate(API_KEYS.progress)
      revalidateDashboard()
    },
  })
}

