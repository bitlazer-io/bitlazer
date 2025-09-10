import { useEffect, useRef } from 'react'
import { usePriceStore } from '../stores/priceStore'
import { priceService } from '../services/priceService'

const PRICE_REFRESH_INTERVAL = 60000 // 1 minute

export const PriceProvider = ({ children }: { children: React.ReactNode }) => {
  const { updatePrices, setLoading, setError } = usePriceStore()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isLoadingRef = useRef(false)

  const fetchPrices = async () => {
    // Prevent concurrent fetches
    if (isLoadingRef.current) {
      return
    }

    isLoadingRef.current = true
    setLoading(true)

    try {
      const { btcPrice, ethPrice, btc24hChange } = await priceService.fetchPrices(true)
      updatePrices(btcPrice, ethPrice, btc24hChange)
      setError(null)
    } catch (error: any) {
      console.error('Error fetching prices:', error)
      setError(error.message || 'Failed to fetch prices from all sources')
    } finally {
      setLoading(false)
      isLoadingRef.current = false
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
    }
  }, [])

  return <>{children}</>
}

export default PriceProvider
