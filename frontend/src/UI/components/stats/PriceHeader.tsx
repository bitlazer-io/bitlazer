import React, { useEffect, useState } from 'react'
import { formatUnits } from 'viem'
import { useReadContract } from 'wagmi'
import { arbitrum } from 'wagmi/chains'
import { ERC20_CONTRACT_ADDRESS } from 'src/web3/contracts'
import { lzrBTC_abi } from 'src/assets/abi/lzrBTC'
import { USDollar, formatCompactNumber, formatPercentage } from 'src/utils/formatters'
import { calculateLzrBTCPrice, formatLzrBTCDisplay } from 'src/utils/lzrBTCConversion'
import { fetchWithCache, CACHE_KEYS, CACHE_TTL, debouncedFetch } from 'src/utils/cache'

interface PriceData {
  wbtcPrice: number
  lzrBTCPrice: number
  priceChange24h: number
  marketCap: number
}

export const PriceHeader: React.FC = () => {
  const [priceData, setPriceData] = useState<PriceData>({
    wbtcPrice: 0,
    lzrBTCPrice: 0,
    priceChange24h: 0,
    marketCap: 0,
  })
  const [loading, setLoading] = useState(true)

  const { data: totalSupply } = useReadContract({
    address: ERC20_CONTRACT_ADDRESS.lzrBTC as `0x${string}`,
    abi: lzrBTC_abi,
    functionName: 'totalSupply',
    chainId: arbitrum.id,
  })

  useEffect(() => {
    const fetchPrices = async (force = false) => {
      try {
        // Use cache and debouncing to prevent API rate limiting
        const data = await fetchWithCache(
          CACHE_KEYS.BTC_PRICE,
          async () => {
            // Debounce multiple simultaneous requests
            return debouncedFetch(CACHE_KEYS.BTC_PRICE, async () => {
              const response = await fetch(
                'https://api.coingecko.com/api/v3/simple/price?ids=wrapped-bitcoin&vs_currencies=usd&include_24hr_change=true',
              )
              if (!response.ok) throw new Error('Failed to fetch price')
              return response.json()
            })
          },
          { ttl: CACHE_TTL.PRICE, force },
        )

        const wbtcPrice = data['wrapped-bitcoin']?.usd || 0
        const priceChange = data['wrapped-bitcoin']?.usd_24h_change || 0

        const supply = totalSupply ? Number(formatUnits(totalSupply as bigint, 18)) : 0
        // Calculate lzrBTC price based on new conversion
        const lzrBTCPrice = calculateLzrBTCPrice(wbtcPrice)
        const marketCap = supply * lzrBTCPrice

        setPriceData({
          wbtcPrice,
          lzrBTCPrice,
          priceChange24h: priceChange,
          marketCap,
        })
        setLoading(false)
      } catch (error) {
        console.error('Error fetching prices:', error)
        // Try to use any stale cached data if available
        const cachedData = await fetchWithCache(CACHE_KEYS.BTC_PRICE, async () => null as any, {
          ttl: CACHE_TTL.LONG,
        }).catch(() => null)

        if (cachedData) {
          const wbtcPrice = cachedData['wrapped-bitcoin']?.usd || 0
          const priceChange = cachedData['wrapped-bitcoin']?.usd_24h_change || 0
          const supply = totalSupply ? Number(formatUnits(totalSupply as bigint, 18)) : 0

          const lzrBTCPrice = calculateLzrBTCPrice(wbtcPrice)
          setPriceData({
            wbtcPrice,
            lzrBTCPrice,
            priceChange24h: priceChange,
            marketCap: supply * lzrBTCPrice,
          })
        }
        setLoading(false)
      }
    }

    fetchPrices()
    const interval = setInterval(() => fetchPrices(true), 30000) // Force refresh every 30s
    return () => clearInterval(interval)
  }, [totalSupply])

  const formatPrice = (price: number) => {
    return USDollar.format(price).replace('.00', '')
  }

  const formatSupply = (supply: number) => {
    return formatCompactNumber(supply)
  }

  const formatMarketCap = (cap: number) => {
    // Always use compact format for large numbers
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(1)}T`
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(1)}M`
    if (cap >= 1e3) return `$${(cap / 1e3).toFixed(1)}K`
    return USDollar.format(cap).replace('.00', '')
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        {/* WBTC Price Card */}
        <div className="relative group w-full h-full min-h-[100px] sm:min-h-[120px] md:min-h-[140px]">
          <div className="absolute inset-0 bg-gradient-to-r from-lightgreen-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm" />
          <div className="relative bg-gradient-to-br from-darkslategray-200/90 via-darkslategray-200/70 to-lightgreen-100/10 backdrop-blur-sm border border-lightgreen-100/50 p-3 md:p-4 lg:p-5 hover:border-lightgreen-100 transition-all duration-300 rounded-[.115rem] h-full flex flex-col justify-between">
            <div className="flex flex-col">
              <div className="text-base md:text-lg lg:text-xl font-ocrx text-white/90 uppercase tracking-wider mb-1">
                WBTC Price
              </div>
              <div className="text-lg md:text-2xl lg:text-3xl font-bold text-lightgreen-100 font-maison-neue mb-1">
                {loading ? (
                  <div className="h-7 w-24 bg-gray-300/10 animate-pulse rounded" />
                ) : (
                  formatPrice(priceData.wbtcPrice)
                )}
              </div>
              {!loading && (
                <div
                  className={`text-sm md:text-base font-ocrx flex items-center gap-1 ${priceData.priceChange24h >= 0 ? 'text-lightgreen-100' : 'text-fuchsia'}`}
                >
                  <span className="text-lg leading-none">{priceData.priceChange24h >= 0 ? '↑' : '↓'}</span>
                  <span>{formatPercentage(Math.abs(priceData.priceChange24h))}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* lzrBTC Price Card */}
        <div className="relative group w-full h-full min-h-[100px] sm:min-h-[120px] md:min-h-[140px]">
          <div className="absolute inset-0 bg-gradient-to-r from-lightgreen-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm" />
          <div className="relative bg-gradient-to-br from-darkslategray-200/90 via-darkslategray-200/70 to-lightgreen-100/10 backdrop-blur-sm border border-lightgreen-100/50 p-3 md:p-4 lg:p-5 hover:border-lightgreen-100 transition-all duration-300 rounded-[.115rem] h-full flex flex-col justify-between">
            <div className="flex flex-col">
              <div className="text-base md:text-lg lg:text-xl font-ocrx text-white/90 uppercase tracking-wider mb-1">
                lzrBTC Price
              </div>
              <div className="text-lg md:text-2xl lg:text-3xl font-bold text-lightgreen-100 font-maison-neue mb-1">
                {loading ? (
                  <div className="h-7 w-24 bg-gray-300/10 animate-pulse rounded" />
                ) : (
                  formatPrice(priceData.lzrBTCPrice)
                )}
              </div>
              <div className="text-sm md:text-base lg:text-lg text-white/70 font-ocrx uppercase">
                1 SAT = 1000 lzrBTC
              </div>
            </div>
          </div>
        </div>

        {/* Total Supply Card */}
        <div className="relative group w-full h-full min-h-[100px] sm:min-h-[120px] md:min-h-[140px]">
          <div className="absolute inset-0 bg-gradient-to-r from-lightgreen-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm" />
          <div className="relative bg-gradient-to-br from-darkslategray-200/90 via-darkslategray-200/70 to-lightgreen-100/10 backdrop-blur-sm border border-lightgreen-100/50 p-3 md:p-4 lg:p-5 hover:border-lightgreen-100 transition-all duration-300 rounded-[.115rem] h-full flex flex-col justify-between">
            <div className="flex flex-col">
              <div className="text-base md:text-lg lg:text-xl font-ocrx text-white/90 uppercase tracking-wider mb-1">
                lzrBTC Supply
              </div>
              <div className="text-lg md:text-2xl lg:text-3xl font-bold text-lightgreen-100 font-maison-neue mb-1">
                {totalSupply ? (
                  formatLzrBTCDisplay(totalSupply as bigint, 2)
                ) : (
                  <div className="h-7 w-24 bg-gray-300/10 animate-pulse rounded" />
                )}
              </div>
              <div className="text-sm md:text-base lg:text-lg text-white/70 font-ocrx uppercase">
                TOKENS ON ARBITRUM
              </div>
            </div>
          </div>
        </div>

        {/* Market Cap Card */}
        <div className="relative group w-full h-full min-h-[100px] sm:min-h-[120px] md:min-h-[140px]">
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm" />
          <div className="relative bg-gradient-to-br from-darkslategray-200/90 via-darkslategray-200/70 to-fuchsia/10 backdrop-blur-sm border border-lightgreen-100/50 p-3 md:p-4 lg:p-5 hover:border-fuchsia transition-all duration-300 rounded-[.115rem] h-full flex flex-col justify-between">
            <div className="flex flex-col">
              <div className="text-base md:text-lg lg:text-xl font-ocrx text-white/90 uppercase tracking-wider mb-1">
                lzrBTC Market Cap
              </div>
              <div className="text-lg md:text-2xl lg:text-3xl font-bold text-fuchsia font-maison-neue mb-1 break-all sm:break-normal">
                {loading ? (
                  <div className="h-7 w-20 bg-gray-300/10 animate-pulse rounded" />
                ) : (
                  formatMarketCap(priceData.marketCap)
                )}
              </div>
              <div className="text-sm md:text-base lg:text-lg text-white/70 font-ocrx uppercase">USD VALUE</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
