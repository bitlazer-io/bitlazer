interface PriceData {
  btcPrice: number
  ethPrice: number
  btc24hChange?: number
}

interface ApiSource {
  name: string
  fetchPrices: () => Promise<PriceData>
}

class PriceService {
  private sources: ApiSource[] = [
    {
      name: 'CoinGecko',
      fetchPrices: this.fetchFromCoinGecko.bind(this),
    },
    {
      name: 'CoinCap',
      fetchPrices: this.fetchFromCoinCap.bind(this),
    },
    {
      name: 'Binance',
      fetchPrices: this.fetchFromBinance.bind(this),
    },
  ]

  private currentSourceIndex = 0

  async fetchPrices(include24hChange = false): Promise<PriceData> {
    for (let attempt = 0; attempt < this.sources.length; attempt++) {
      const sourceIndex = (this.currentSourceIndex + attempt) % this.sources.length
      const source = this.sources[sourceIndex]

      try {
        console.log(`Fetching prices from ${source.name}...`)
        const prices = await source.fetchPrices()

        // If 24h change is requested and not available from this source, try to get it from CoinGecko
        if (include24hChange && !prices.btc24hChange && source.name !== 'CoinGecko') {
          try {
            const coinGeckoSource = this.sources.find((s) => s.name === 'CoinGecko')
            if (coinGeckoSource) {
              const coinGeckoData = await coinGeckoSource.fetchPrices()
              prices.btc24hChange = coinGeckoData.btc24hChange
            }
          } catch (error) {
            // 24h change is optional, don't fail if we can't get it
            console.warn('Could not fetch 24h change data')
          }
        }

        // If successful, make this source the primary one for next time
        this.currentSourceIndex = sourceIndex
        console.log(`Successfully fetched prices from ${source.name}`)
        return prices
      } catch (error) {
        console.warn(`Failed to fetch prices from ${source.name}:`, error)

        // If this was the last attempt, throw the error
        if (attempt === this.sources.length - 1) {
          throw new Error(`All price sources failed. Last error: ${error}`)
        }
      }
    }

    throw new Error('All price sources exhausted')
  }

  private async fetchFromCoinGecko(): Promise<PriceData> {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=wrapped-bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true',
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      },
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return {
      btcPrice: data['wrapped-bitcoin']?.usd || 0,
      ethPrice: data['ethereum']?.usd || 0,
      btc24hChange: data['wrapped-bitcoin']?.usd_24h_change || undefined,
    }
  }

  private async fetchFromCoinCap(): Promise<PriceData> {
    const [btcResponse, ethResponse] = await Promise.all([
      fetch('https://api.coincap.io/v2/assets/bitcoin', {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      }),
      fetch('https://api.coincap.io/v2/assets/ethereum', {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      }),
    ])

    if (!btcResponse.ok || !ethResponse.ok) {
      throw new Error('CoinCap API error')
    }

    const [btcData, ethData] = await Promise.all([btcResponse.json(), ethResponse.json()])

    return {
      btcPrice: parseFloat(btcData.data?.priceUsd || '0'),
      ethPrice: parseFloat(ethData.data?.priceUsd || '0'),
    }
  }

  private async fetchFromBinance(): Promise<PriceData> {
    const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbols=["BTCUSDT","ETHUSDT"]', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Find BTC and ETH prices in the array
    const btcData = data.find((item: any) => item.symbol === 'BTCUSDT')
    const ethData = data.find((item: any) => item.symbol === 'ETHUSDT')

    return {
      btcPrice: parseFloat(btcData?.price || '0'),
      ethPrice: parseFloat(ethData?.price || '0'),
    }
  }
}

export const priceService = new PriceService()
