import { describe, it, expect, vi } from 'vitest'
import { cache, fetchWithCache, debouncedFetch, rateLimiter, CACHE_KEYS } from '../../utils/cache'

describe('cache utilities', () => {
  it('sets and gets values with TTL', () => {
    cache.clear()
    vi.useFakeTimers()
    const now = new Date('2024-01-01T00:00:00Z')
    vi.setSystemTime(now)

    cache.set('k', { v: 1 }, 1000)
    expect(cache.get<{ v: number }>('k')).toEqual({ v: 1 })

    // Advance past TTL and ensure it expires
    vi.setSystemTime(new Date(now.getTime() + 1500))
    expect(cache.get('k')).toBeNull()
  })

  it('fetchWithCache caches, serves stale on error, and respects force/ttl', async () => {
    cache.clear()
    const key = CACHE_KEYS.NETWORK_STATS
    const fetcher = vi.fn().mockResolvedValue({ ok: 1 })

    // First call hits fetcher and caches
    const a = await fetchWithCache(key, fetcher, { ttl: 1000 })
    expect(a).toEqual({ ok: 1 })
    expect(fetcher).toHaveBeenCalledTimes(1)

    // Second call returns cached without calling fetcher
    const b = await fetchWithCache(key, fetcher, { ttl: 1000 })
    expect(b).toEqual({ ok: 1 })
    expect(fetcher).toHaveBeenCalledTimes(1)

    // Force refresh calls fetcher again
    const c = await fetchWithCache(key, fetcher, { ttl: 1000, force: true })
    expect(c).toEqual({ ok: 1 })
    expect(fetcher).toHaveBeenCalledTimes(2)

    // Expire TTL triggers new fetch
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(new Date(now + 1500))
    const d = await fetchWithCache(key, fetcher, { ttl: 1000 })
    expect(d).toEqual({ ok: 1 })
    expect(fetcher).toHaveBeenCalledTimes(3)

    // Error path returns stale cache if available
    const badFetcher = vi.fn().mockRejectedValue(new Error('fail'))
    const e = await fetchWithCache(key, badFetcher, { ttl: 1000 })
    expect(e).toEqual({ ok: 1 })
  })

  it('debouncedFetch coalesces concurrent requests', async () => {
    cache.clear()
    const fetcher = vi.fn().mockResolvedValue('X')
    const p1 = debouncedFetch('key', fetcher)
    const p2 = debouncedFetch('key', fetcher)

    await expect(p1).resolves.toBe('X')
    await expect(p2).resolves.toBe('X')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('rateLimiter enforces minimum interval', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn().mockResolvedValue('ok')

    const p1 = rateLimiter.throttle('A', fetcher)
    // Immediately queue second call; should wait ~1000ms
    const p2 = rateLimiter.throttle('A', fetcher)

    // Run timers so delayed call can proceed
    await vi.runAllTimersAsync()

    await expect(p1).resolves.toBe('ok')
    await expect(p2).resolves.toBe('ok')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
