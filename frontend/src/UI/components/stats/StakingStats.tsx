import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReadContract, usePublicClient } from 'wagmi'
import { mainnet } from 'src/web3/chains'
import { STAKING_CONTRACTS } from 'src/web3/contracts'
import { stakeAdapter_abi } from 'src/assets/abi/stakeAdapter'
import { formatUnits, parseAbiItem } from 'viem'
import { PrimaryLabel, SecondaryLabel } from './StatsLabels'
import { formatTokenAmount, formatMoney, formatTxHash } from 'src/utils/formatters'
import { Skeleton } from '../skeleton/Skeleton'
import { usePriceStore } from 'src/stores/priceStore'
import { fetchRecentStakingActivity } from '../../pages/stats/services/recentActivityService'

interface StakingStatsData {
  totalStaked: number
  totalRewards: number
  apr: number
  totalPoolSize: number
  numberOfStakers: number
  averageStakeSize: number
  rewardsDistributed24h: number
  recentStakes: Array<{
    amount: string
    action: 'stake' | 'unstake'
    txHash: string
    timestamp: number
    asset: string
  }>
}

export const StakingStats: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<StakingStatsData>({
    totalStaked: 0,
    totalRewards: 0,
    apr: 0,
    totalPoolSize: 0,
    numberOfStakers: 0,
    averageStakeSize: 0,
    rewardsDistributed24h: 0,
    recentStakes: [],
  })
  const [loading, setLoading] = useState(true)
  const [loadingRecentActivity, setLoadingRecentActivity] = useState(true)
  const { btcPrice, isLoading: priceLoading } = usePriceStore()

  const bitlazerClient = usePublicClient({ chainId: mainnet.id })

  const { data: totalStaked } = useReadContract({
    address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
    abi: stakeAdapter_abi,
    functionName: 'totalSupply',
    chainId: mainnet.id,
  })

  const { data: apy } = useReadContract({
    address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
    abi: stakeAdapter_abi,
    functionName: 'getApy',
    chainId: mainnet.id,
  })

  const { data: targetApyBps } = useReadContract({
    address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
    abi: stakeAdapter_abi,
    functionName: 'targetApyBps',
    chainId: mainnet.id,
  })

  // Separate function for fetching recent activity from API
  const fetchRecentActivity = async () => {
    try {
      setLoadingRecentActivity(true)
      const activity = await fetchRecentStakingActivity(5)

      const recentStakes = activity.map((item) => ({
        amount: item.amount,
        action: item.action,
        txHash: item.txHash,
        timestamp: item.timestamp,
        asset: item.asset,
      }))

      // Update only the recent stakes without affecting main stats
      setStats((prevStats) => ({
        ...prevStats,
        recentStakes: recentStakes,
      }))
      setLoadingRecentActivity(false)
    } catch (error) {
      console.error('Error fetching staking activity from API:', error)
      setLoadingRecentActivity(false)
    }
  }

  useEffect(() => {
    const fetchStakingStats = async () => {
      if (!bitlazerClient) return

      try {
        const staked = totalStaked ? Number(formatUnits(totalStaked as bigint, 18)) : 0

        // APR comes directly from contract as a percentage value (e.g., 33333 = 33,333%)
        const aprValue = apy ? Number(apy) : targetApyBps ? Number(targetApyBps) : 0

        // Fetch unique stakers from blockchain events
        const currentBlock = await bitlazerClient.getBlockNumber()
        const fromBlock = currentBlock > 3000000n ? currentBlock - 3000000n : 0n

        // Get all stake events to count unique stakers
        const stakedLogs = await bitlazerClient.getLogs({
          address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
          event: parseAbiItem('event Staked(address indexed user, uint256 amount)'),
          fromBlock,
          toBlock: currentBlock,
        })

        const uniqueStakerAddresses = new Set<string>()
        let totalRewardsDistributed = 0

        // Count unique stakers
        for (const log of stakedLogs) {
          if (log.args && 'user' in log.args) {
            uniqueStakerAddresses.add((log.args.user as string).toLowerCase())
          }
        }

        // Try to fetch Unstaked events to calculate total rewards
        try {
          const unstakedLogs = await bitlazerClient.getLogs({
            address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
            event: parseAbiItem(
              'event Unstaked(address indexed user, uint256 amount, uint256 rewards, uint256 totalUnstaked)',
            ),
            fromBlock,
            toBlock: currentBlock,
          })

          // Sum up all rewards distributed
          for (const log of unstakedLogs) {
            if (log.args && 'rewards' in log.args) {
              totalRewardsDistributed += Number(formatUnits(log.args.rewards as bigint, 18))
            }
          }
        } catch (error) {
          console.log('Could not fetch Unstaked events for rewards calculation')
        }

        const numberOfStakers = uniqueStakerAddresses.size || 0
        const avgStake = staked > 0 && numberOfStakers > 0 ? staked / numberOfStakers : 0

        // Calculate daily rewards based on APR and total staked
        const dailyRewards = staked > 0 && aprValue > 0 ? (staked * aprValue) / 100 / 365 : 0

        setStats({
          totalStaked: staked,
          totalRewards: totalRewardsDistributed,
          apr: aprValue,
          totalPoolSize: staked,
          numberOfStakers,
          averageStakeSize: avgStake,
          rewardsDistributed24h: dailyRewards,
          recentStakes: [],
        })
        setLoading(false)

        // Fetch recent activity separately (non-blocking)
        fetchRecentActivity()
      } catch (error) {
        console.error('Error calculating staking stats:', error)

        // Use actual contract values as fallback
        const staked = totalStaked ? Number(formatUnits(totalStaked as bigint, 18)) : 0
        const aprValue = apy ? Number(apy) : targetApyBps ? Number(targetApyBps) : 0

        setStats({
          totalStaked: staked,
          totalRewards: 0,
          apr: aprValue,
          totalPoolSize: staked,
          numberOfStakers: 0,
          averageStakeSize: 0,
          rewardsDistributed24h: 0,
          recentStakes: [],
        })
        setLoading(false)
      }
    }

    fetchStakingStats()
    const mainStatsInterval = setInterval(fetchStakingStats, 90000)
    const recentActivityInterval = setInterval(fetchRecentActivity, 90000)
    return () => {
      clearInterval(mainStatsInterval)
      clearInterval(recentActivityInterval)
    }
  }, [totalStaked, apy, targetApyBps, bitlazerClient])

  const formatAPR = (apr: number) => {
    // APR is already a percentage value (e.g., 33333 = 33,333%)
    return `${apr.toLocaleString()}%`
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now() / 1000
    const diff = now - timestamp
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="relative group w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-lightgreen-100/5 via-transparent to-fuchsia/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative bg-gradient-to-br from-darkslategray-200/90 via-darkslategray-200/80 to-lightgreen-100/10 backdrop-blur-sm border border-lightgreen-100 p-4 md:p-5 hover:border-lightgreen-100 hover:shadow-[0_0_20px_rgba(102,213,96,0.2)] transition-all duration-300 rounded-[.115rem]">
        <h2 className="text-lg md:text-xl lg:text-2xl font-ocrx text-lightgreen-100 mb-3 md:mb-4 uppercase tracking-wide">
          Staking Statistics
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
          <div className="bg-black/80 p-4 border border-lightgreen-100/30 rounded-[.115rem]">
            <PrimaryLabel className="mb-2">TOTAL POOL SIZE</PrimaryLabel>
            <div className="text-base md:text-2xl lg:text-3xl font-bold text-lightgreen-100 font-maison-neue mb-1">
              {loading ? (
                <div className="h-9 bg-gray-300/10 animate-pulse rounded" />
              ) : (
                <>{formatTokenAmount(stats.totalPoolSize)}</>
              )}
            </div>
            <SecondaryLabel>lzrBTC STAKED</SecondaryLabel>
          </div>

          <div className="bg-black/80 p-4 border border-fuchsia/30 rounded-[.115rem]">
            <PrimaryLabel className="mb-2">CURRENT APR</PrimaryLabel>
            <div className="text-base md:text-2xl lg:text-3xl font-bold text-fuchsia font-maison-neue mb-1 flex items-center gap-2">
              {loading ? (
                <div className="h-9 bg-gray-300/10 animate-pulse rounded w-24" />
              ) : (
                <>
                  {formatAPR(stats.apr)}
                  <span className="text-lg animate-pulse">🔥</span>
                </>
              )}
            </div>
            <SecondaryLabel>ANNUAL RETURNS</SecondaryLabel>
          </div>

          <div className="bg-black/80 p-4 border border-lightgreen-100/30 rounded-[.115rem]">
            <PrimaryLabel className="mb-2">TVL (USD)</PrimaryLabel>
            <div className="text-base md:text-2xl lg:text-3xl font-bold text-lightgreen-100 font-maison-neue mb-1">
              {loading || priceLoading ? (
                <div className="h-9 bg-gray-300/10 animate-pulse rounded" />
              ) : (
                <>{formatMoney(stats.totalPoolSize * btcPrice)}</>
              )}
            </div>
            <SecondaryLabel>STAKED lzrBTC IN USD</SecondaryLabel>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 md:mb-4 w-full">
          <div className="bg-black/80 p-2 sm:p-3 border border-lightgreen-100/30 rounded-[.115rem] w-full min-h-[80px] flex flex-col justify-center">
            <PrimaryLabel className="mb-1">STAKERS</PrimaryLabel>
            <div className="text-base md:text-lg lg:text-xl font-bold text-lightgreen-100 font-maison-neue mb-1">
              {loading ? (
                <div className="h-6 bg-gray-300/10 animate-pulse rounded w-12" />
              ) : (
                <>{stats.numberOfStakers}</>
              )}
            </div>
            <SecondaryLabel>ACTIVE USERS</SecondaryLabel>
          </div>

          <div className="bg-black/80 p-2 sm:p-3 border border-lightgreen-100/30 rounded-[.115rem] w-full min-h-[80px] flex flex-col justify-center">
            <PrimaryLabel className="mb-1">AVG STAKE</PrimaryLabel>
            <div className="text-base md:text-lg lg:text-xl font-bold text-lightgreen-100 font-maison-neue mb-1">
              {loading ? (
                <div className="h-6 bg-gray-300/10 animate-pulse rounded w-20" />
              ) : (
                <>{formatTokenAmount(stats.averageStakeSize)}</>
              )}
            </div>
            <SecondaryLabel>lzrBTC PER USER</SecondaryLabel>
          </div>

          <div className="bg-black/80 p-2 sm:p-3 border border-lightgreen-100/30 rounded-[.115rem] w-full min-h-[80px] flex flex-col justify-center">
            <PrimaryLabel className="mb-1">24H REWARDS</PrimaryLabel>
            <div className="text-base md:text-lg lg:text-xl font-bold text-lightgreen-100 font-maison-neue mb-1">
              {loading ? (
                <div className="h-6 bg-gray-300/10 animate-pulse rounded w-20" />
              ) : (
                <>{formatTokenAmount(stats.rewardsDistributed24h)}</>
              )}
            </div>
            <SecondaryLabel>lzrBTC DISTRIBUTED</SecondaryLabel>
          </div>

          <div className="bg-black/80 p-2 sm:p-3 border border-lightgreen-100/30 rounded-[.115rem] w-full min-h-[80px] flex flex-col justify-center">
            <PrimaryLabel className="mb-1">TOTAL REWARDS</PrimaryLabel>
            <div className="text-base md:text-lg lg:text-xl font-bold text-lightgreen-100 font-maison-neue mb-1">
              {loading ? (
                <div className="h-6 bg-gray-300/10 animate-pulse rounded w-16" />
              ) : (
                <>{formatTokenAmount(stats.totalRewards)}</>
              )}
            </div>
            <SecondaryLabel>lzrBTC EARNED</SecondaryLabel>
          </div>
        </div>

        <div className="relative overflow-hidden bg-black/80 p-4 border border-lightgreen-100/30 rounded-[.115rem]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-lightgreen-100/5 to-transparent animate-pulse" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 gap-3">
              <div>
                <h3 className="text-base md:text-xl lg:text-2xl font-ocrx text-lightgreen-100 mb-1 uppercase">
                  Staking Rewards
                </h3>
                <p className="text-sm md:text-base text-white/70 font-maison-neue max-w-md">
                  Earn native Bitcoin gas fee rewards and LZR tokens by staking your lzrBTC
                </p>
              </div>
              <div className="text-left md:text-right">
                <div className="text-base md:text-xl lg:text-2xl font-bold text-fuchsia font-maison-neue">
                  {formatAPR(stats.apr)}
                </div>
                <SecondaryLabel>APR</SecondaryLabel>
              </div>
            </div>
            <button
              onClick={() => navigate('/bridge/stake')}
              className="bg-gradient-to-r from-lightgreen-100 to-lightgreen-100/90 hover:from-lightgreen-100/90 hover:to-lightgreen-100 text-black font-ocrx uppercase py-2 px-6 rounded-[.115rem] transition-all duration-200 hover:shadow-[0_0_15px_rgba(102,213,96,0.4)] text-sm md:text-base tracking-wide inline-block"
            >
              Start Staking Now
            </button>
          </div>
        </div>

        {(loadingRecentActivity || stats.recentStakes.length > 0) && (
          <div className="mt-4">
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
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))
                : stats.recentStakes.slice(0, 3).map((stake, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-black/60 border border-lightgreen-100/20 hover:border-lightgreen-100/40 transition-all group/item rounded-[.115rem]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base md:text-lg text-lightgreen-100 font-maison-neue font-bold">
                          {formatTokenAmount(Number(stake.amount))} {stake.asset}
                        </span>
                        <span
                          className={`text-sm md:text-base font-ocrx uppercase ${
                            stake.action === 'stake' ? 'text-lightgreen-100' : 'text-fuchsia'
                          }`}
                        >
                          {stake.action === 'stake' ? '↑ STAKE' : '↓ UNSTAKE'}
                        </span>
                        <a
                          href={`https://bitlazer.calderaexplorer.xyz/tx/${stake.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm md:text-base text-fuchsia hover:text-lightgreen-100 font-ocrx transition-all hover:underline decoration-2 underline-offset-2"
                        >
                          {formatTxHash(stake.txHash)}
                        </a>
                      </div>
                      <span className="text-sm md:text-base text-white/70 font-ocrx uppercase">
                        {formatTime(stake.timestamp)}
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
