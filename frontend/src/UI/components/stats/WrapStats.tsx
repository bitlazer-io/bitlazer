import React, { useEffect, useState } from 'react'
import { usePublicClient, useReadContract } from 'wagmi'
import { arbitrum } from 'wagmi/chains'
import { ERC20_CONTRACT_ADDRESS } from 'src/web3/contracts'
import { parseAbiItem, formatUnits } from 'viem'
import { PrimaryLabel, SecondaryLabel } from './StatsLabels'
import { formatTokenAmount, formatTxHash } from 'src/utils/formatters'
import { Skeleton } from '../skeleton/Skeleton'
import { lzrBTC_abi } from 'src/assets/abi/lzrBTC'
import { fetchRecentWrapActivity } from '../../pages/stats/services/recentActivityService'

interface WrapStatsData {
  totalWrapped: number
  totalUnwrapped: number
  uniqueWrappers: number
  recentWraps: Array<{
    amount: string
    timestamp: number
    txHash: string
    asset: string
    type: 'wrap' | 'unwrap'
  }>
}

export const WrapStats: React.FC = () => {
  const [stats, setStats] = useState<WrapStatsData>({
    totalWrapped: 0,
    totalUnwrapped: 0,
    uniqueWrappers: 0,
    recentWraps: [],
  })
  const [loading, setLoading] = useState(true)
  const [loadingRecentActivity, setLoadingRecentActivity] = useState(true)

  const publicClient = usePublicClient({ chainId: arbitrum.id })

  // Get total supply to use as minimum wrapped amount
  const { data: totalSupply } = useReadContract({
    address: ERC20_CONTRACT_ADDRESS.lzrBTC as `0x${string}`,
    abi: lzrBTC_abi,
    functionName: 'totalSupply',
    chainId: arbitrum.id,
  })

  // Separate function for fetching recent activity from API
  const fetchRecentActivity = async () => {
    try {
      setLoadingRecentActivity(true)
      const activity = await fetchRecentWrapActivity(5)

      const recentWraps = activity.map((item) => ({
        amount: item.amount,
        timestamp: item.timestamp,
        txHash: item.txHash,
        asset: item.asset,
        type: item.type,
      }))

      // Update only the recent wraps without affecting main stats
      setStats((prevStats) => ({
        ...prevStats,
        recentWraps: recentWraps,
      }))
      setLoadingRecentActivity(false)
    } catch (error) {
      console.error('Error fetching wrap activity from API:', error)
      setLoadingRecentActivity(false)
    }
  }

  useEffect(() => {
    const fetchWrapStats = async () => {
      if (!publicClient) return

      try {
        // Use total supply for main stats (fast)
        const currentSupply = totalSupply ? Number(formatUnits(totalSupply as bigint, 18)) : 0

        // Fetch wrap and unwrap totals
        const currentBlock = await publicClient.getBlockNumber()
        const fromBlock = currentBlock > 3000000n ? currentBlock - 3000000n : 0n

        // Count unique wrappers
        const wrapLogs = await publicClient.getLogs({
          address: ERC20_CONTRACT_ADDRESS.lzrBTC as `0x${string}`,
          event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
          args: {
            from: '0x0000000000000000000000000000000000000000' as `0x${string}`,
          },
          fromBlock,
          toBlock: currentBlock,
        })

        const uniqueWrapperAddresses = new Set<string>()
        let totalUnwrapped = 0

        // Count unique recipients of wraps
        for (const log of wrapLogs) {
          if (log.args && 'to' in log.args) {
            uniqueWrapperAddresses.add((log.args.to as string).toLowerCase())
          }
        }

        // Count unwraps (burns)
        const unwrapLogs = await publicClient.getLogs({
          address: ERC20_CONTRACT_ADDRESS.lzrBTC as `0x${string}`,
          event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
          args: {
            to: '0x0000000000000000000000000000000000000000' as `0x${string}`,
          },
          fromBlock,
          toBlock: currentBlock,
        })

        for (const log of unwrapLogs) {
          if (log.args && 'value' in log.args) {
            totalUnwrapped += Number(formatUnits(log.args.value as bigint, 18))
          }
        }

        setStats({
          totalWrapped: currentSupply + totalUnwrapped, // Total ever wrapped
          totalUnwrapped: totalUnwrapped,
          uniqueWrappers: uniqueWrapperAddresses.size,
          recentWraps: [],
        })
        setLoading(false)

        // Fetch recent activity separately (non-blocking)
        fetchRecentActivity()
      } catch (error) {
        console.error('Error fetching wrap stats:', error)

        // Use total supply as fallback
        const currentSupply = totalSupply ? Number(formatUnits(totalSupply as bigint, 18)) : 0
        setStats({
          totalWrapped: currentSupply,
          totalUnwrapped: 0,
          uniqueWrappers: 0,
          recentWraps: [],
        })
        setLoading(false)
        setLoadingRecentActivity(false)
      }
    }

    fetchWrapStats()
    const mainStatsInterval = setInterval(fetchWrapStats, 90000)
    const recentActivityInterval = setInterval(fetchRecentActivity, 90000)
    return () => {
      clearInterval(mainStatsInterval)
      clearInterval(recentActivityInterval)
    }
  }, [publicClient, totalSupply])

  const formatAmount = (amount: number) => {
    return formatTokenAmount(amount)
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now() / 1000
    const diff = now - timestamp
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="relative group w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-lightgreen-100/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative bg-gradient-to-br from-darkslategray-200/90 via-darkslategray-200/80 to-lightgreen-100/10 backdrop-blur-sm border border-lightgreen-100 p-4 md:p-5 hover:border-lightgreen-100 hover:shadow-[0_0_20px_rgba(102,213,96,0.2)] transition-all duration-300 rounded-[.115rem]">
        <h2 className="text-lg md:text-xl lg:text-2xl font-ocrx text-lightgreen-100 mb-3 md:mb-4 uppercase tracking-wide">
          Wrap Statistics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 md:mb-4">
          <div className="bg-black/80 p-3 border border-lightgreen-100/30 rounded-[.115rem]">
            <PrimaryLabel className="mb-1">TOTAL WRAPPED</PrimaryLabel>
            <div className="text-base md:text-xl lg:text-2xl font-bold text-lightgreen-100 font-maison-neue">
              {loading ? (
                <div className="h-7 bg-gray-300/10 animate-pulse rounded" />
              ) : (
                <>{formatAmount(stats.totalWrapped)}</>
              )}
            </div>
            <SecondaryLabel className="mt-1">WBTC → lzrBTC</SecondaryLabel>
          </div>

          <div className="bg-black/80 p-3 border border-fuchsia/30 rounded-[.115rem]">
            <PrimaryLabel className="mb-1">TOTAL UNWRAPPED</PrimaryLabel>
            <div className="text-base md:text-xl lg:text-2xl font-bold text-fuchsia font-maison-neue">
              {loading ? (
                <div className="h-7 bg-gray-300/10 animate-pulse rounded" />
              ) : (
                <>{formatAmount(stats.totalUnwrapped)}</>
              )}
            </div>
            <SecondaryLabel className="mt-1">lzrBTC → WBTC</SecondaryLabel>
          </div>

          <div className="bg-black/80 p-3 border border-lightgreen-100/30 rounded-[.115rem]">
            <PrimaryLabel className="mb-1">UNIQUE WRAPPERS</PrimaryLabel>
            <div className="text-base md:text-xl lg:text-2xl font-bold text-lightgreen-100 font-maison-neue">
              {loading ? (
                <div className="h-7 bg-gray-300/10 animate-pulse rounded w-16" />
              ) : (
                <>{stats.uniqueWrappers}</>
              )}
            </div>
            <SecondaryLabel className="mt-1">USERS</SecondaryLabel>
          </div>
        </div>

        {(loadingRecentActivity || stats.recentWraps.length > 0) && (
          <div>
            <PrimaryLabel className="mb-2">RECENT ACTIVITY</PrimaryLabel>
            <div className="space-y-1">
              {loadingRecentActivity
                ? // Show 3 skeleton placeholders while loading
                  Array.from({ length: 3 }, (_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="flex items-center justify-between p-2 bg-black/60 border border-lightgreen-100/20 rounded-[.115rem]"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))
                : stats.recentWraps.slice(0, 3).map((wrap, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-black/60 border border-lightgreen-100/20 hover:border-lightgreen-100/40 transition-all group/item rounded-[.115rem]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base md:text-lg text-lightgreen-100 font-maison-neue font-bold">
                          {formatAmount(Number(wrap.amount))} {wrap.asset}
                        </span>
                        <span
                          className={`text-sm md:text-base font-ocrx uppercase ${
                            wrap.type === 'wrap' ? 'text-yellow-400' : 'text-yellow-400'
                          }`}
                        >
                          {wrap.type === 'wrap' ? '↑ WRAP' : '↓ UNWRAP'}
                        </span>
                        <a
                          href={`https://arbiscan.io/tx/${wrap.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm md:text-base text-fuchsia hover:text-lightgreen-100 font-ocrx transition-all hover:underline decoration-2 underline-offset-2"
                        >
                          {formatTxHash(wrap.txHash)}
                        </a>
                      </div>
                      <span className="text-sm md:text-base text-white/70 font-ocrx uppercase">
                        {formatTime(wrap.timestamp)}
                      </span>
                    </div>
                  ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
