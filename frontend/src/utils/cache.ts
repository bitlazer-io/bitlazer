/**
 * Simple cache utility for API responses to prevent rate limiting
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class CacheManager {
  private cache: Map<string, CacheItem<any>> = new Map()
  private localStorage: boolean = true

  constructor() {
    // Check if localStorage is available
    try {
      const test = '__localStorage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      this.localStorage = true
    } catch {
      this.localStorage = false
    }

    // Load existing cache from localStorage
    if (this.localStorage) {
      this.loadFromLocalStorage()
    }
  }

  /**
   * Get cached data if it exists and is still valid
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    const now = Date.now()
    const isExpired = now - item.timestamp > item.ttl

    if (isExpired) {
      this.cache.delete(key)
      this.saveToLocalStorage()
      return null
    }

    return item.data as T
  }

  /**
   * Set cache data with TTL (time to live) in milliseconds
   */
  set<T>(key: string, data: T, ttl: number = 60000): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    }

    this.cache.set(key, item)
    this.saveToLocalStorage()
  }

  /**
   * Clear specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key)
    this.saveToLocalStorage()
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    if (this.localStorage) {
      localStorage.removeItem('bitlazer_cache')
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToLocalStorage(): void {
    if (!this.localStorage) return

    try {
      const cacheData: Record<string, CacheItem<any>> = {}
      this.cache.forEach((value, key) => {
        cacheData[key] = value
      })
      localStorage.setItem('bitlazer_cache', JSON.stringify(cacheData))
    } catch (error) {
      console.error('Failed to save cache to localStorage:', error)
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromLocalStorage(): void {
    if (!this.localStorage) return

    try {
      const stored = localStorage.getItem('bitlazer_cache')
      if (stored) {
        const cacheData = JSON.parse(stored)
        Object.entries(cacheData).forEach(([key, value]) => {
          this.cache.set(key, value as CacheItem<any>)
        })
      }
    } catch (error) {
      console.error('Failed to load cache from localStorage:', error)
      localStorage.removeItem('bitlazer_cache')
    }
  }
}

// Singleton instance
export const cache = new CacheManager()

/**
 * Fetch with cache wrapper
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number // Time to live in milliseconds
    force?: boolean // Force refresh ignoring cache
  } = {},
): Promise<T> {
  const { ttl = 60000, force = false } = options // Default 1 minute cache

  // Check cache first unless forced refresh
  if (!force) {
    const cached = cache.get<T>(key)
    if (cached !== null) {
      return cached
    }
  }

  try {
    // Fetch fresh data
    const data = await fetcher()

    // Cache the result
    cache.set(key, data, ttl)

    return data
  } catch (error) {
    // If fetch fails, try to return stale cache if available
    const staleCache = cache.get<T>(key)
    if (staleCache !== null) {
      console.warn(`Using stale cache for ${key} due to fetch error:`, error)
      return staleCache
    }

    throw error
  }
}

/**
 * Debounced fetch to prevent rapid API calls
 */
const pendingRequests = new Map<string, Promise<any>>()

export async function debouncedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  // If there's already a pending request for this key, return it
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!
  }

  // Create new request and store it
  const request = fetcher().finally(() => {
    // Clean up after request completes
    pendingRequests.delete(key)
  })

  pendingRequests.set(key, request)
  return request
}

/**
 * Rate limiter for API calls
 */
class RateLimiter {
  private lastCallTime: Map<string, number> = new Map()
  private minInterval: number

  constructor(minInterval: number = 1000) {
    this.minInterval = minInterval
  }

  async throttle<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const now = Date.now()
    const lastCall = this.lastCallTime.get(key) || 0
    const timeSinceLastCall = now - lastCall

    if (timeSinceLastCall < this.minInterval) {
      const delay = this.minInterval - timeSinceLastCall
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    this.lastCallTime.set(key, Date.now())
    return fetcher()
  }
}

export const rateLimiter = new RateLimiter(1000) // 1 second minimum between calls

/**
 * Cache keys for different data types
 */
export const CACHE_KEYS = {
  BTC_PRICE: 'btc_price',
  LZRBTC_SUPPLY: 'lzrbtc_supply',
  STAKING_APR: 'staking_apr',
  NETWORK_STATS: 'network_stats',
  WRAP_STATS: 'wrap_stats',
  BRIDGE_STATS: 'bridge_stats',
} as const

/**
 * Cache TTL values (in milliseconds)
 */
export const CACHE_TTL = {
  PRICE: 30 * 1000, // 30 seconds for price data
  SUPPLY: 60 * 1000, // 1 minute for supply data
  STATS: 2 * 60 * 1000, // 2 minutes for general stats
  NETWORK: 15 * 1000, // 15 seconds for network data
  LONG: 5 * 60 * 1000, // 5 minutes for rarely changing data
} as const
