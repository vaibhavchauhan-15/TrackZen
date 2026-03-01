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

// Create a cache provider that saves to sessionStorage but does NOT
// load from it initially to prevent hydration mismatches
function createCacheProvider() {
  const map = new Map<string, any>()
  
  return () => {
    // Set up save listener only on client
    if (typeof window !== 'undefined') {
      const saveToStorage = () => {
        const data: Record<string, any> = {}
        map.forEach((value, key) => {
          // Only cache successful data, skip errors
          if (value && !value.error) {
            data[key] = value
          }
        })
        try {
          sessionStorage.setItem('swr-cache', JSON.stringify(data))
        } catch {}
      }
      
      // Save on page unload
      window.addEventListener('beforeunload', saveToStorage)
    }
    
    return map
  }
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
        dedupingInterval: 5000, // 5s deduplication
        focusThrottleInterval: 10000, // 10s focus throttle
        loadingTimeout: 10000, // 10s loading timeout
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
