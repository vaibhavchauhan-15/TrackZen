import useSWR, { mutate } from 'swr'
import useSWRMutation from 'swr/mutation'
import { fetcher, postFetcher, putFetcher, deleteFetcher, apiConfigs } from '@/lib/swr-config'

// ==================== DASHBOARD ====================
export function useDashboardData() {
  return useSWR('/api/dashboard/initial', fetcher, {
    ...apiConfigs.dashboard,
    fallbackData: null,
  })
}

// ==================== SESSION ====================
export function useSession() {
  return useSWR('/api/auth/session', fetcher, {
    ...apiConfigs.session,
    fallbackData: null,
  })
}

// ==================== PLANS ====================
export function usePlans() {
  return useSWR('/api/plans', fetcher, {
    ...apiConfigs.plans,
  })
}

export function usePlan(planId: string | null) {
  return useSWR(
    planId ? `/api/plans/${planId}` : null,
    fetcher,
    {
      ...apiConfigs.plans,
      revalidateOnMount: true,
    }
  )
}

// NEW: Unified planner page hook - fetches plan + analytics in ONE call
// Use this for the planner detail page instead of calling usePlan + useStudyTrackerAnalytics
export function usePlannerPage(planId: string | null) {
  return useSWR(
    planId ? `/api/planner/${planId}/initial` : null,
    fetcher,
    {
      ...apiConfigs.plans,
      // Keep previous data while loading
      keepPreviousData: true,
    }
  )
}

// Create new plan
export function useCreatePlan() {
  return useSWRMutation('/api/plans', postFetcher, {
    onSuccess: () => {
      // OPTIMIZATION: Only revalidate plans list
      // Dashboard will update naturally when user navigates there
      mutate('/api/plans')
    },
  })
}

// Update plan
export function useUpdatePlan(planId: string) {
  return useSWRMutation(`/api/plans/${planId}`, putFetcher, {
    onSuccess: () => {
      // OPTIMIZATION: Only revalidate the specific plan and list
      mutate(`/api/plans/${planId}`)
      mutate('/api/plans')
    },
  })
}

// Delete plan
export function useDeletePlan(planId: string) {
  return useSWRMutation(`/api/plans/${planId}`, deleteFetcher, {
    onSuccess: () => {
      // OPTIMIZATION: Only revalidate plans list
      mutate('/api/plans')
    },
  })
}

// ==================== TOPICS ====================
// Update topic status
export function useUpdateTopicStatus(planId: string, topicId: string) {
  return useSWRMutation(
    `/api/plans/${planId}/topics/${topicId}`,
    putFetcher,
    {
      // OPTIMIZATION: Optimistic update with selective revalidation
      // Don't refetch everything - the new API endpoint returns updated stats
      populateCache: (result, currentData) => {
        return result
      },
      revalidate: false,
      onSuccess: () => {
        // Only revalidate the plan data (with shallow update)
        // Analytics will update when user switches to Analytics tab
        setTimeout(() => {
          mutate(`/api/plans/${planId}`)
        }, 100)
      },
    }
  )
}

// Bulk schedule topics
export function useBulkScheduleTopics(planId: string) {
  return useSWRMutation(
    `/api/plans/${planId}/topics/bulk-schedule`,
    postFetcher,
    {
      onSuccess: () => {
        // OPTIMIZATION: Only revalidate the plan
        mutate(`/api/plans/${planId}`)
      },
    }
  )
}

// ==================== HABITS ====================
export function useHabits() {
  return useSWR('/api/habits', fetcher, {
    ...apiConfigs.habits,
  })
}

// Create habit
export function useCreateHabit() {
  return useSWRMutation('/api/habits', postFetcher, {
    onSuccess: () => {
      // OPTIMIZATION: Only revalidate habits
      mutate('/api/habits')
    },
  })
}

// Update habit
export function useUpdateHabit(habitId: string) {
  return useSWRMutation(`/api/habits/${habitId}`, putFetcher, {
    onSuccess: () => {
      // OPTIMIZATION: Only revalidate habits
      mutate('/api/habits')
    },
  })
}

// Delete habit
export function useDeleteHabit(habitId: string) {
  return useSWRMutation(`/api/habits/${habitId}`, deleteFetcher, {
    onSuccess: () => {
      // OPTIMIZATION: Only revalidate habits
      mutate('/api/habits')
    },
  })
}

// Log habit
export function useLogHabit() {
  return useSWRMutation('/api/habits/log', postFetcher, {
    // OPTIMIZATION: Optimistic update - UI changes instantly, no loading spinner
    // Only revalidate once in the background after success
    populateCache: (result, currentData) => {
      return result
    },
    revalidate: false, // Don't revalidate immediately
    onSuccess: () => {
      // Single background revalidation (batched and debounced by browser)
      // Habits data will update based on the optimistic cache
      // Dashboard will refetch when user navigates there (with cached data shown first)
      setTimeout(() => {
        mutate('/api/habits')
        // Let dashboard revalidate naturally when user views it
        // Streaks only change once per day, so no rush to revalidate
      }, 100) // Small delay to batch multiple mutations
    },
  })
}

// ==================== STUDY LOGS ====================
export function useStudyLogs(planId?: string) {
  const url = planId ? `/api/study-logs?planId=${planId}` : '/api/study-logs'
  return useSWR(url, fetcher, {
    ...apiConfigs.studyLogs,
  })
}

// Create study log
export function useCreateStudyLog() {
  return useSWRMutation('/api/study-logs', postFetcher, {
    onSuccess: (data: any) => {
      // OPTIMIZATION: Only revalidate study logs and related analytics
      mutate('/api/study-logs')
      if (data?.planId) {
        mutate(`/api/study-logs?planId=${data.planId}`)
        // Analytics will update when user views that tab
      }
    },
  })
}

// ==================== ANALYTICS ====================
// NEW: Unified analytics hook - fetches ALL analytics data at once
// Use this instead of calling multiple analytics endpoints separately
export function useAnalyticsAll(planId: string | null) {
  return useSWR(
    planId ? `/api/analytics/all?planId=${planId}` : null,
    fetcher,
    {
      ...apiConfigs.analytics,
      // Keep previous data while loading to prevent flickering
      keepPreviousData: true,
    }
  )
}

// Legacy: Individual analytics hooks (kept for backwards compatibility)
export function useStudyTrackerAnalytics(planId: string | null) {
  return useSWR(
    planId ? `/api/analytics/study-tracker?planId=${planId}` : null,
    fetcher,
    {
      ...apiConfigs.analytics,
    }
  )
}

// ==================== STREAKS ====================
export function useStreaks() {
  return useSWR('/api/streaks', fetcher, {
    ...apiConfigs.streaks,
  })
}

// ==================== MISTAKES ====================
export function useMistakes(planId?: string) {
  const url = planId ? `/api/mistakes?planId=${planId}` : '/api/mistakes'
  return useSWR(url, fetcher, apiConfigs.plans)
}

// Create mistake
export function useCreateMistake() {
  return useSWRMutation('/api/mistakes', postFetcher, {
    onSuccess: () => {
      // OPTIMIZATION: Only revalidate mistakes endpoints
      mutate((key) => typeof key === 'string' && key.startsWith('/api/mistakes'))
    },
  })
}

// Update mistake
export function useUpdateMistake(mistakeId: string) {
  return useSWRMutation(`/api/mistakes/${mistakeId}`, putFetcher, {
    onSuccess: () => {
      // OPTIMIZATION: Only revalidate mistakes endpoints
      mutate((key) => typeof key === 'string' && key.startsWith('/api/mistakes'))
    },
  })
}

// ==================== MOCK TESTS ====================
export function useMockTests(planId?: string) {
  const url = planId ? `/api/mock-tests?planId=${planId}` : '/api/mock-tests'
  return useSWR(url, fetcher, apiConfigs.plans)
}

// Create mock test
export function useCreateMockTest() {
  return useSWRMutation('/api/mock-tests', postFetcher, {
    onSuccess: () => {
      // OPTIMIZATION: Only revalidate mock tests endpoints
      mutate((key) => typeof key === 'string' && key.startsWith('/api/mock-tests'))
    },
  })
}

// ==================== REVISIONS ====================
export function useRevisions(planId?: string) {
  const url = planId ? `/api/revisions?planId=${planId}` : '/api/revisions'
  return useSWR(url, fetcher, apiConfigs.plans)
}

// Create revision
export function useCreateRevision() {
  return useSWRMutation('/api/revisions', postFetcher, {
    onSuccess: () => {
      // OPTIMIZATION: Only revalidate revisions endpoints
      mutate((key) => typeof key === 'string' && key.startsWith('/api/revisions'))
    },
  })
}

// ==================== WEEKLY REVIEWS ====================
export function useWeeklyReviews() {
  return useSWR('/api/weekly-reviews', fetcher, apiConfigs.plans)
}

// Create weekly review
export function useCreateWeeklyReview() {
  return useSWRMutation('/api/weekly-reviews', postFetcher, {
    onSuccess: () => {
      mutate('/api/weekly-reviews')
    },
  })
}

// ==================== AI GENERATION ====================
export function useGeneratePlan() {
  return useSWRMutation('/api/ai/generate-plan', postFetcher, {
    onSuccess: () => {
      // OPTIMIZATION: Only revalidate plans
      mutate('/api/plans')
    },
  })
}

// ==================== UTILITY FUNCTIONS ====================

// Revalidate all dashboard-related data
// OPTIMIZATION: Use sparingly - prefer component-level revalidation
export function revalidateDashboard() {
  mutate('/api/dashboard/initial')
  // Don't cascade revalidation to everything - let components handle their own data
}

// Revalidate all analytics (use after bulk data changes)
export function revalidateAnalytics() {
  mutate((key) => typeof key === 'string' && key.startsWith('/api/analytics'))
}

// Clear all cache (nuclear option - use only when absolutely necessary)
export function clearAllCache() {
  mutate(() => true, undefined, { revalidate: false })
}

// Prefetch data for faster navigation
export function prefetchPage(endpoint: string) {
  mutate(endpoint, fetcher(endpoint), { revalidate: false })
}
