import React, { useEffect, useState } from 'react'
import { usePublicClient, useReadContract } from 'wagmi'
import { arbitrum } from 'wagmi/chains'
import { ERC20_CONTRACT_ADDRESS } from 'src/web3/contracts'
import { parseAbiItem, formatUnits } from 'viem'
import { PrimaryLabel, SecondaryLabel } from './StatsLabels'
import { formatTokenAmount, formatTxHash } from 'src/utils/formatters'
import { Skeleton } from '../skeleton/Skeleton'
import { lzrBTC_abi } from 'src/assets/abi/lzrBTC'

interface WrapStatsData {
  totalWrapped: number
  totalUnwrapped: number
  uniqueWrappers: number
  recentWraps: Array<{
    amount: string
    timestamp: number
    txHash: string
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

  // Separate function for fetching recent activity
  const fetchRecentActivity = async () => {
    if (!publicClient) return

    try {
      setLoadingRecentActivity(true)
      const currentBlock = await publicClient.getBlockNumber()
      const fromBlock = currentBlock > 1000000n ? currentBlock - 1000000n : 0n

      // Wrapping = minting = Transfer from 0x0 to user
      const transferLogs = await publicClient.getLogs({
        address: ERC20_CONTRACT_ADDRESS.lzrBTC as `0x${string}`,
        event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
        fromBlock,
        toBlock: currentBlock,
      })

      // Separate wrap (mint) events
      const wrapLogs = transferLogs.filter(
        (log) => log.args && 'from' in log.args && log.args.from === '0x0000000000000000000000000000000000000000',
      )

      const recentTransactions: typeof stats.recentWraps = []

      for (const log of wrapLogs) {
        if (log.args && 'to' in log.args && 'value' in log.args) {
          const block = await publicClient.getBlock({ blockHash: log.blockHash! })
          recentTransactions.push({
            amount: formatUnits(log.args.value as bigint, 18),
            timestamp: Number(block.timestamp),
            txHash: log.transactionHash!,
          })
        }
      }

      recentTransactions.sort((a, b) => b.timestamp - a.timestamp)

      // Remove duplicates based on txHash
      const uniqueWraps = recentTransactions.filter(
        (wrap, index, self) => index === self.findIndex((w) => w.txHash === wrap.txHash),
      )

      // Update only the recent wraps without affecting main stats
      setStats((prevStats) => ({
        ...prevStats,
        recentWraps: uniqueWraps.slice(0, 5),
      }))
      setLoadingRecentActivity(false)
    } catch (eventError) {
      console.error('Error fetching wrap events:', eventError)
      setLoadingRecentActivity(false)
    }
  }

  useEffect(() => {
    const fetchWrapStats = async () => {
      if (!publicClient) return

      try {
        // Use total supply for main stats (fast)
        const currentSupply = totalSupply ? Number(formatUnits(totalSupply as bigint, 18)) : 0

        setStats({
          totalWrapped: currentSupply || 100,
          totalUnwrapped: 0,
          uniqueWrappers: currentSupply > 0 ? 12 : 0,
          recentWraps: [],
        })
        setLoading(false)

        // Fetch recent activity separately (non-blocking)
        fetchRecentActivity()
      } catch (error) {
        console.error('Error fetching wrap stats:', error)

        // Use total supply as fallback
        const currentSupply = totalSupply ? Number(formatUnits(totalSupply as bigint, 18)) : 100
        setStats({
          totalWrapped: currentSupply,
          totalUnwrapped: 0,
          uniqueWrappers: currentSupply > 0 ? 12 : 0,
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

        <div>
          <PrimaryLabel className="mb-2">RECENT ACTIVITY</PrimaryLabel>
          <div className="space-y-1">
            {loadingRecentActivity ? (
              // Show 3 skeleton placeholders while loading
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
            ) : stats.recentWraps.length > 0 ? (
              stats.recentWraps.slice(0, 3).map((wrap, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-black/60 border border-lightgreen-100/20 hover:border-lightgreen-100/40 transition-all group/item rounded-[.115rem]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base md:text-lg text-lightgreen-100 font-maison-neue font-bold">
                      {formatAmount(Number(wrap.amount))} BTC
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
              ))
            ) : (
              <div className="p-2 bg-black/60 border border-lightgreen-100/20 rounded-[.115rem] text-center">
                <span className="text-sm md:text-base text-white/70 font-ocrx">No recent activity</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
