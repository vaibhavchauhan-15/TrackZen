import { SWRConfiguration } from 'swr'

// Global SWR configuration
// OPTIMIZATION: Conservative revalidation strategy - trust the cache more
export const swrConfig: SWRConfiguration = {
  // Dedupe requests within timeframe - prevents duplicate simultaneous calls
  dedupingInterval: 10000, // 10s - increased from 2s
  
  // Revalidation settings - only revalidate when explicitly needed
  revalidateOnFocus: false, // ❌ Don't refetch on window focus (user data doesn't change in background)
  revalidateOnReconnect: true, // ✅ Do refetch when network reconnects
  revalidateIfStale: false, // ❌ Don't auto-revalidate stale data (we control it manually)
  
  // Keep previous data while fetching new data - no loading spinners
  keepPreviousData: true,
  
  // Error retry configuration
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  shouldRetryOnError: true,
  
  // Loading timeout
  loadingTimeout: 3000,
  
  // Focus throttle - if revalidateOnFocus is enabled somewhere
  focusThrottleInterval: 60000, // 1 min - increased from 5s
}

// API-specific configurations
// OPTIMIZATION: Removed all refreshInterval to prevent unnecessary auto-refetching
// Data only updates when user performs actions (optimistic updates + manual revalidation)
export const apiConfigs = {
  // Dashboard data - short deduping for realtime feel
  dashboard: {
    dedupingInterval: 60000, // 1 min - prevents duplicate calls
    revalidateOnMount: true, // Fetch on initial mount
  },
  
  // Plan data - medium cache for stable data
  plans: {
    dedupingInterval: 180000, // 3 min - plans don't change often
    revalidateOnMount: true, // Fetch on initial mount
  },
  
  // Analytics - long cache for expensive calculations
  analytics: {
    dedupingInterval: 300000, // 5 min - analytics are expensive to compute
    revalidateOnMount: true, // Fetch on initial mount
  },
  
  // Habits - short cache for daily tracking
  habits: {
    dedupingInterval: 60000, // 1 min
    revalidateOnMount: true, // Fetch on initial mount
  },
  
  // Session - very stable, long cache
  session: {
    dedupingInterval: 300000, // 5 min - session rarely changes
    revalidateOnMount: false,
  },
  
  // Study logs - medium cache
  studyLogs: {
    dedupingInterval: 120000, // 2 min
    revalidateOnMount: true, // Fetch on initial mount
  },
  
  // Streaks - long cache (only changes once per day)
  streaks: {
    dedupingInterval: 300000, // 5 min
    revalidateOnMount: true, // Fetch on initial mount
  },

  // Static data - very long cache for data that rarely changes
  static: {
    dedupingInterval: 600000, // 10 min
    revalidateOnMount: false,
    revalidateOnFocus: false,
  },
}

// Generic fetcher with error handling
export async function fetcher<T = any>(url: string): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  if (!res.ok) {
    let errorInfo
    try {
      errorInfo = await res.json()
    } catch (e) {
      errorInfo = { message: 'Failed to parse error response' }
    }
    
    const error: any = new Error(
      `API Error (${res.status}) at ${url}: ${errorInfo.error || errorInfo.message || 'Unknown error'}`
    )
    error.info = errorInfo
    error.status = res.status
    error.url = url
    throw error
  }
  
  return res.json()
}

// POST fetcher for mutations
export async function postFetcher<T = any>(
  url: string,
  { arg }: { arg: any }
): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(arg),
  })
  
  if (!res.ok) {
    let errorInfo
    try {
      errorInfo = await res.json()
    } catch (e) {
      errorInfo = { message: 'Failed to parse error response' }
    }
    
    const error: any = new Error(
      `API Error (${res.status}) at ${url}: ${errorInfo.error || errorInfo.message || 'Unknown error'}`
    )
    error.info = errorInfo
    error.status = res.status
    error.url = url
    throw error
  }
  
  return res.json()
}

// PUT fetcher for updates
export async function putFetcher<T = any>(
  url: string,
  { arg }: { arg: any }
): Promise<T> {
  const res = await fetch(url, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(arg),
  })
  
  if (!res.ok) {
    const error: any = new Error('An error occurred while updating the data.')
    error.info = await res.json()
    error.status = res.status
    throw error
  }
  
  return res.json()
}

// DELETE fetcher
export async function deleteFetcher<T = any>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  if (!res.ok) {
    const error: any = new Error('An error occurred while deleting the data.')
    error.info = await res.json()
    error.status = res.status
    throw error
  }
  
  return res.json()
}
