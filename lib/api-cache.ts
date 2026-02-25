// Simple in-memory cache for API responses
type CacheEntry<T> = {
  data: T
  timestamp: number
}

class APICache {
  private cache: Map<string, CacheEntry<any>>
  private defaultTTL: number = 60000 // 60 seconds default for better performance

  constructor() {
    this.cache = new Map()
  }

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if entry has expired
    if (Date.now() > entry.timestamp) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  // Helper to invalidate cache by pattern
  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}

// Export singleton instance
export const apiCache = new APICache()

// Cache durations for different data types
export const CACHE_TTL = {
  DASHBOARD: 30000, // 30 seconds - frequently changing
  PLANS: 60000, // 1 minute
  HABITS: 30000, // 30 seconds
  STREAKS: 60000, // 1 minute
  ANALYTICS: 120000, // 2 minutes - less frequently changing
}
