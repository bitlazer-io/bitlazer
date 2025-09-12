import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const okResponse = (data: any) =>
  ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => data,
  }) as Response

const badResponse = (status = 500, statusText = 'ERR') =>
  ({
    ok: false,
    status,
    statusText,
    json: async () => ({}),
  }) as Response

describe('priceService', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('falls back when CoinGecko fails and CoinCap succeeds', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch' as any).mockImplementation((url: any) => {
      const s = String(url)
      if (s.includes('coingecko.com')) {
        return Promise.resolve(badResponse(500, 'CG DOWN'))
      }
      if (s.includes('coincap.io')) {
        // CoinCap returns bitcoin and ethereum prices
        const makeAsset = (priceUsd: string) => ({ data: { priceUsd } })
        if (s.endsWith('/bitcoin')) return Promise.resolve(okResponse(makeAsset('70000')))
        if (s.endsWith('/ethereum')) return Promise.resolve(okResponse(makeAsset('3000')))
      }
      // Binance not reached in this case
      return Promise.reject(new Error('Unexpected url ' + s))
    })

    const { priceService } = await import('../../services/priceService')
    const result = await priceService.fetchPrices(false)
    expect(fetchMock).toHaveBeenCalled()
    expect(result.btcPrice).toBe(70000)
    expect(result.ethPrice).toBe(3000)
  })

  it('merges 24h change from CoinGecko when primary source lacks it', async () => {
    // Control call order: 1) CG fails (main attempt), 2) CoinCap succeeds, 3) CG succeeds for 24h change fetch
    let cgCalls = 0
    const fetchMock = vi.spyOn(globalThis, 'fetch' as any).mockImplementation((url: any) => {
      const s = String(url)
      if (s.includes('coingecko.com')) {
        cgCalls += 1
        if (cgCalls === 1) {
          // First CG attempt fails (forces primary to be CoinCap)
          return Promise.resolve(badResponse(500, 'CG FAIL'))
        }
        // Second CG call (for 24h change) succeeds
        return Promise.resolve(
          okResponse({
            'wrapped-bitcoin': { usd: 69000, usd_24h_change: 2.5 },
            ethereum: { usd: 2800 },
          }),
        )
      }
      if (s.includes('coincap.io')) {
        const makeAsset = (priceUsd: string) => ({ data: { priceUsd } })
        if (s.endsWith('/bitcoin')) return Promise.resolve(okResponse(makeAsset('70000')))
        if (s.endsWith('/ethereum')) return Promise.resolve(okResponse(makeAsset('3000')))
      }
      return Promise.reject(new Error('Unexpected url ' + s))
    })

    const { priceService } = await import('../../services/priceService')
    const result = await priceService.fetchPrices(true)
    expect(fetchMock).toHaveBeenCalled()
    // Primary prices come from CoinCap
    expect(result.btcPrice).toBe(70000)
    expect(result.ethPrice).toBe(3000)
    // 24h change merged from CoinGecko
    expect(result.btc24hChange).toBe(2.5)
  })
})
