import { useEffect, useRef } from 'react'
import { usePriceStore } from '../stores/priceStore'

const PRICE_REFRESH_INTERVAL = 60000 // 1 minute
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price'

export const PriceProvider = ({ children }: { children: React.ReactNode }) => {
  const { updatePrices, setLoading, setError } = usePriceStore()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchPrices = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    try {
      setLoading(true)

      const response = await fetch(`${COINGECKO_API_URL}?ids=wrapped-bitcoin,ethereum&vs_currencies=usd`, {
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.statusText}`)
      }

      const data = await response.json()

      const btcPrice = data['wrapped-bitcoin']?.usd || 0
      const ethPrice = data['ethereum']?.usd || 0

      updatePrices(btcPrice, ethPrice)
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching prices:', error)
        setError(error.message || 'Failed to fetch prices')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchPrices()

    // Set up interval for periodic updates
    intervalRef.current = setInterval(fetchPrices, PRICE_REFRESH_INTERVAL)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return <>{children}</>
}

export default PriceProvider
