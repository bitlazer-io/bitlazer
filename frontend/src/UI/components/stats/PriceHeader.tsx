import React, { useEffect, useState } from 'react'
import { formatUnits } from 'viem'
import { useReadContract } from 'wagmi'
import { arbitrum } from 'wagmi/chains'
import { ERC20_CONTRACT_ADDRESS } from 'src/web3/contracts'
import { lzrBTC_abi } from 'src/assets/abi/lzrBTC'
import { PrimaryLabel, SecondaryLabel } from './StatsLabels'

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
    const fetchPrices = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=wrapped-bitcoin&vs_currencies=usd&include_24hr_change=true',
        )
        const data = await response.json()

        const wbtcPrice = data['wrapped-bitcoin']?.usd || 0
        const priceChange = data['wrapped-bitcoin']?.usd_24h_change || 0

        const supply = totalSupply ? Number(formatUnits(totalSupply as bigint, 8)) : 0
        const marketCap = supply * wbtcPrice

        setPriceData({
          wbtcPrice,
          lzrBTCPrice: wbtcPrice,
          priceChange24h: priceChange,
          marketCap,
        })
        setLoading(false)
      } catch (error) {
        console.error('Error fetching prices:', error)
        setLoading(false)
      }
    }

    fetchPrices()
    const interval = setInterval(fetchPrices, 30000)
    return () => clearInterval(interval)
  }, [totalSupply])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatMarketCap = (cap: number) => {
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`
    if (cap >= 1e3) return `$${(cap / 1e3).toFixed(2)}K`
    return formatPrice(cap)
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* WBTC Price Card */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-lightgreen-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm" />
        <div className="relative bg-gradient-to-br from-darkslategray-200/90 via-darkslategray-200/70 to-lightgreen-100/10 backdrop-blur-sm border border-lightgreen-100/50 p-4 hover:border-lightgreen-100 transition-all duration-300 rounded-[.115rem]">
          <div className="flex flex-col">
            <PrimaryLabel className="mb-1">WBTC Price</PrimaryLabel>
            <div className="text-2xl font-bold text-lightgreen-100 font-maison-neue mb-1">
              {loading ? (
                <div className="h-7 w-24 bg-gray-300/10 animate-pulse rounded" />
              ) : (
                formatPrice(priceData.wbtcPrice)
              )}
            </div>
            {!loading && (
              <div
                className={`text-xs font-ocrx flex items-center gap-1 ${priceData.priceChange24h >= 0 ? 'text-lightgreen-100' : 'text-fuchsia'}`}
              >
                <span className="text-lg leading-none">{priceData.priceChange24h >= 0 ? '↑' : '↓'}</span>
                <span>{Math.abs(priceData.priceChange24h).toFixed(2)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* lzrBTC Price Card */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-lightgreen-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm" />
        <div className="relative bg-gradient-to-br from-darkslategray-200/90 via-darkslategray-200/70 to-lightgreen-100/10 backdrop-blur-sm border border-lightgreen-100/50 p-4 hover:border-lightgreen-100 transition-all duration-300 rounded-[.115rem]">
          <div className="flex flex-col">
            <PrimaryLabel className="mb-1">lzrBTC Price</PrimaryLabel>
            <div className="text-2xl font-bold text-lightgreen-100 font-maison-neue mb-1">
              {loading ? (
                <div className="h-7 w-24 bg-gray-300/10 animate-pulse rounded" />
              ) : (
                formatPrice(priceData.lzrBTCPrice)
              )}
            </div>
            <SecondaryLabel>PEGGED 1:1</SecondaryLabel>
          </div>
        </div>
      </div>

      {/* Total Supply Card */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-lightgreen-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm" />
        <div className="relative bg-gradient-to-br from-darkslategray-200/90 via-darkslategray-200/70 to-lightgreen-100/10 backdrop-blur-sm border border-lightgreen-100/50 p-4 hover:border-lightgreen-100 transition-all duration-300 rounded-[.115rem]">
          <div className="flex flex-col">
            <PrimaryLabel className="mb-1">Total Supply</PrimaryLabel>
            <div className="text-2xl font-bold text-lightgreen-100 font-maison-neue mb-1">
              {totalSupply ? (
                `${Number(formatUnits(totalSupply as bigint, 8)).toFixed(4)}`
              ) : (
                <div className="h-7 w-24 bg-gray-300/10 animate-pulse rounded" />
              )}
            </div>
            <SecondaryLabel>lzrBTC</SecondaryLabel>
          </div>
        </div>
      </div>

      {/* Market Cap Card */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm" />
        <div className="relative bg-gradient-to-br from-darkslategray-200/90 via-darkslategray-200/70 to-fuchsia/10 backdrop-blur-sm border border-lightgreen-100/50 p-4 hover:border-fuchsia transition-all duration-300 rounded-[.115rem]">
          <div className="flex flex-col">
            <PrimaryLabel className="mb-1">Market Cap</PrimaryLabel>
            <div className="text-2xl font-bold text-fuchsia font-maison-neue mb-1">
              {loading ? (
                <div className="h-7 w-20 bg-gray-300/10 animate-pulse rounded" />
              ) : (
                formatMarketCap(priceData.marketCap)
              )}
            </div>
            <SecondaryLabel>USD VALUE</SecondaryLabel>
          </div>
        </div>
      </div>
    </div>
  )
}
