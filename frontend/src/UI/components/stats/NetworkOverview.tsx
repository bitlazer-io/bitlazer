import React, { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { arbitrum } from 'wagmi/chains'
import { mainnet } from 'src/web3/chains'
import { PrimaryLabel, SecondaryLabel } from './StatsLabels'

interface NetworkStats {
  arbitrumBlockNumber: bigint | null
  bitlazerBlockNumber: bigint | null
  gasPrice: bigint | null
  transactionCount: number
}

export const NetworkOverview: React.FC = () => {
  const [stats, setStats] = useState<NetworkStats>({
    arbitrumBlockNumber: null,
    bitlazerBlockNumber: null,
    gasPrice: null,
    transactionCount: 0,
  })
  const [loading, setLoading] = useState(true)

  const arbitrumClient = usePublicClient({ chainId: arbitrum.id })
  const bitlazerClient = usePublicClient({ chainId: mainnet.id })

  useEffect(() => {
    const fetchNetworkStats = async () => {
      try {
        const [arbBlock, gasPrice] = await Promise.all([
          arbitrumClient?.getBlockNumber(),
          arbitrumClient?.getGasPrice(),
        ])

        let bitlazerBlock = null
        try {
          bitlazerBlock = await bitlazerClient?.getBlockNumber()
        } catch (error) {
          // Bitlazer L3 connection error
        }

        setStats({
          arbitrumBlockNumber: arbBlock || null,
          bitlazerBlockNumber: bitlazerBlock || null,
          gasPrice: gasPrice || null,
          transactionCount: 0,
        })
        setLoading(false)
      } catch (error) {
        console.error('Error fetching network stats:', error)
        setLoading(false)
      }
    }

    fetchNetworkStats()
    const interval = setInterval(fetchNetworkStats, 12000)
    return () => clearInterval(interval)
  }, [arbitrumClient, bitlazerClient])

  const formatGwei = (wei: bigint | null) => {
    if (!wei) return '0'
    const gwei = Number(wei) / 1e9
    return gwei.toFixed(2)
  }

  return (
    <div className="relative group w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-lightgreen-100/5 via-transparent to-fuchsia/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative bg-gradient-to-br from-darkslategray-200/90 via-darkslategray-200/80 to-lightgreen-100/10 backdrop-blur-sm border border-lightgreen-100 p-4 md:p-5 hover:border-lightgreen-100 hover:shadow-[0_0_20px_rgba(102,213,96,0.2)] transition-all duration-300 rounded-[.115rem]">
        <h2 className="text-lg md:text-xl lg:text-2xl font-ocrx text-lightgreen-100 mb-3 md:mb-4 uppercase tracking-wide">
          Network Status
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Arbitrum Block */}
          <div className="bg-black/80 p-3 border border-lightgreen-100/30 hover:border-lightgreen-100/50 transition-all rounded-[.115rem]">
            <PrimaryLabel className="mb-1">ARBITRUM</PrimaryLabel>
            <div className="text-base md:text-xl lg:text-2xl font-bold text-lightgreen-100 font-maison-neue">
              {loading ? (
                <div className="h-6 bg-gray-300/10 animate-pulse rounded w-28" />
              ) : (
                <>#{stats.arbitrumBlockNumber?.toString() || 'N/A'}</>
              )}
            </div>
            <SecondaryLabel className="mt-1">BLOCK</SecondaryLabel>
          </div>

          {/* Bitlazer Block */}
          <div className="bg-black/80 p-3 border border-lightgreen-100/30 hover:border-lightgreen-100/50 transition-all rounded-[.115rem]">
            <PrimaryLabel className="mb-1">BITLAZER L3</PrimaryLabel>
            <div className="text-base md:text-xl lg:text-2xl font-bold text-lightgreen-100 font-maison-neue">
              {loading ? (
                <div className="h-6 bg-gray-300/10 animate-pulse rounded w-28" />
              ) : (
                <>#{stats.bitlazerBlockNumber?.toString() || 'OFFLINE'}</>
              )}
            </div>
            <SecondaryLabel className="mt-1">BLOCK</SecondaryLabel>
          </div>

          {/* Gas Price */}
          <div className="bg-black/80 p-3 border border-lightgreen-100/30 hover:border-lightgreen-100/50 transition-all rounded-[.115rem]">
            <PrimaryLabel className="mb-1">GAS PRICE</PrimaryLabel>
            <div className="text-base md:text-xl lg:text-2xl font-bold text-lightgreen-100 font-maison-neue">
              {loading ? (
                <div className="h-6 bg-gray-300/10 animate-pulse rounded w-16" />
              ) : (
                <>{formatGwei(stats.gasPrice)}</>
              )}
            </div>
            <SecondaryLabel className="mt-1">GWEI</SecondaryLabel>
          </div>

          {/* Network Status */}
          <div className="bg-black/80 p-3 border border-lightgreen-100/30 hover:border-lightgreen-100/50 transition-all rounded-[.115rem]">
            <PrimaryLabel className="mb-1">STATUS</PrimaryLabel>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${!loading ? 'bg-lightgreen-100' : 'bg-gray-300'} ${!loading ? 'animate-pulse' : ''}`}
              />
              <span className="text-base md:text-xl lg:text-2xl font-bold text-lightgreen-100 font-maison-neue">
                {loading ? 'LOADING' : 'ONLINE'}
              </span>
            </div>
            <SecondaryLabel className="mt-1">LIVE</SecondaryLabel>
          </div>
        </div>
      </div>
    </div>
  )
}
