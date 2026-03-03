'use client'

import { ReactNode } from 'react'
import { SWRConfig } from 'swr'

// Global fetcher for SWR
const globalFetcher = async (url: string) => {
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

const CACHE_KEY = 'swr-cache'

/**
 * Cache provider that:
 * - Pre-populates the in-memory Map from sessionStorage on first load so
 *   users see stale-while-revalidate content instantly instead of a spinner.
 * - Saves non-error entries back to sessionStorage on page unload.
 *
 * A single Map instance is created once so it survives React re-renders
 * without resetting the cache.
 */
function createCacheProvider() {
  // Singleton map — created once at module load time
  const map = new Map<string, any>()

  // Pre-populate from sessionStorage (client only, safe to read synchronously)
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY)
      if (raw) {
        const saved: Record<string, any> = JSON.parse(raw)
        Object.entries(saved).forEach(([k, v]) => map.set(k, v))
      }
    } catch {}

    // Persist on navigation away
    window.addEventListener('beforeunload', () => {
      const data: Record<string, any> = {}
      map.forEach((value, key) => {
        // Only persist successful (non-error) data
        if (value && !value.error) {
          data[key] = value
        }
      })
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(data))
      } catch {}
    })
  }

  // SWR expects the provider to be a function that returns the Map
  return () => map
}

// Create single cache instance to persist across renders
const cacheProvider = createCacheProvider()

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: globalFetcher,
        provider: cacheProvider,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 10000,     // 10s global dedup — prevents duplicate in-flight requests
        focusThrottleInterval: 30000, // 30s focus throttle
        loadingTimeout: 10000,        // 10s loading timeout
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        keepPreviousData: true,
        onError: (error, key) => {
          if ((error as any).status !== 401 && (error as any).status !== 403) {
            console.error(`SWR Error [${key}]:`, error)
          }
        },
      }}
    >
      {children}
    </SWRConfig>
  )
}
