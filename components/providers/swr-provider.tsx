'use client'

import { ReactNode } from 'react'
import { SWRConfig, Cache } from 'swr'

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

// Create a persistent cache provider using sessionStorage
function sessionStorageProvider(): Map<string, any> {
  if (typeof window === 'undefined') {
    return new Map()
  }
  
  // Initialize from sessionStorage
  const map = new Map<string, any>()
  const stored = sessionStorage.getItem('swr-cache')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      Object.entries(parsed).forEach(([key, value]) => {
        map.set(key, value)
      })
    } catch {}
  }

  // Save to sessionStorage before unload
  window.addEventListener('beforeunload', () => {
    const data: Record<string, any> = {}
    map.forEach((value, key) => {
      // Only cache successful data, skip errors
      if (value && !value.error) {
        data[key] = value
      }
    })
    sessionStorage.setItem('swr-cache', JSON.stringify(data))
  })

  return map
}

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: globalFetcher,
        provider: sessionStorageProvider,
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
