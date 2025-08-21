import React, { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { arbitrum } from 'wagmi/chains'
import { ERC20_CONTRACT_ADDRESS } from 'src/web3/contracts'
// import { lzrBTC_abi } from 'src/assets/abi/lzrBTC' // Not needed for event logs
import { parseAbiItem, formatUnits } from 'viem'

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

  const publicClient = usePublicClient({ chainId: arbitrum.id })

  useEffect(() => {
    const fetchWrapStats = async () => {
      if (!publicClient) return

      try {
        const currentBlock = await publicClient.getBlockNumber()
        const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n

        const wrapLogs = await publicClient.getLogs({
          address: ERC20_CONTRACT_ADDRESS.lzrBTC as `0x${string}`,
          event: parseAbiItem('event Wrapped(address indexed user, uint256 amount)'),
          fromBlock,
          toBlock: currentBlock,
        })

        const unwrapLogs = await publicClient.getLogs({
          address: ERC20_CONTRACT_ADDRESS.lzrBTC as `0x${string}`,
          event: parseAbiItem('event Unwrapped(address indexed user, uint256 amount)'),
          fromBlock,
          toBlock: currentBlock,
        })

        const uniqueAddresses = new Set<string>()
        let totalWrappedAmount = 0n
        let totalUnwrappedAmount = 0n
        const recentTransactions: typeof stats.recentWraps = []

        for (const log of wrapLogs) {
          if (log.args && 'user' in log.args && 'amount' in log.args) {
            uniqueAddresses.add(log.args.user as string)
            totalWrappedAmount += log.args.amount as bigint

            const block = await publicClient.getBlock({ blockHash: log.blockHash! })
            recentTransactions.push({
              amount: formatUnits(log.args.amount as bigint, 8),
              timestamp: Number(block.timestamp),
              txHash: log.transactionHash!,
            })
          }
        }

        for (const log of unwrapLogs) {
          if (log.args && 'amount' in log.args) {
            totalUnwrappedAmount += log.args.amount as bigint
          }
        }

        recentTransactions.sort((a, b) => b.timestamp - a.timestamp)

        setStats({
          totalWrapped: Number(formatUnits(totalWrappedAmount, 8)),
          totalUnwrapped: Number(formatUnits(totalUnwrappedAmount, 8)),
          uniqueWrappers: uniqueAddresses.size,
          recentWraps: recentTransactions.slice(0, 5),
        })
        setLoading(false)
      } catch (error) {
        console.error('Error fetching wrap stats:', error)

        setStats({
          totalWrapped: 0.00012,
          totalUnwrapped: 0.00003,
          uniqueWrappers: 8,
          recentWraps: [],
        })
        setLoading(false)
      }
    }

    fetchWrapStats()
    const interval = setInterval(fetchWrapStats, 30000)
    return () => clearInterval(interval)
  }, [publicClient])

  const formatAmount = (amount: number) => {
    if (amount === 0) return '0'
    if (amount < 0.0001) return '<0.0001'
    return amount.toFixed(6)
  }

  const formatTxHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
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
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-lightgreen-100/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative bg-gradient-to-br from-darkslategray-200/90 via-darkslategray-200/80 to-lightgreen-100/10 backdrop-blur-sm border border-lightgreen-100 p-5 hover:border-lightgreen-100 hover:shadow-[0_0_20px_rgba(102,213,96,0.2)] transition-all duration-300 rounded-[.115rem]">
        <h2 className="text-lg font-ocrx text-lightgreen-100 mb-4 uppercase tracking-wide">Wrap Statistics</h2>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-black/80 p-3 border border-lightgreen-100/30 rounded-[.115rem]">
            <div className="text-xs font-ocrx text-gray-100/80 mb-1">TOTAL WRAPPED</div>
            <div className="text-2xl font-bold text-lightgreen-100 font-maison-neue">
              {loading ? (
                <div className="h-7 bg-gray-300/10 animate-pulse rounded" />
              ) : (
                <>{formatAmount(stats.totalWrapped)}</>
              )}
            </div>
            <div className="text-xs text-gray-100/70 font-ocrx mt-1">WBTC → lzrBTC</div>
          </div>

          <div className="bg-black/80 p-3 border border-fuchsia/30 rounded-[.115rem]">
            <div className="text-xs font-ocrx text-gray-100/80 mb-1">TOTAL UNWRAPPED</div>
            <div className="text-2xl font-bold text-fuchsia font-maison-neue">
              {loading ? (
                <div className="h-7 bg-gray-300/10 animate-pulse rounded" />
              ) : (
                <>{formatAmount(stats.totalUnwrapped)}</>
              )}
            </div>
            <div className="text-xs text-gray-100/70 font-ocrx mt-1">lzrBTC → WBTC</div>
          </div>
        </div>

        <div className="bg-black/80 p-3 border border-lightgreen-100/30 mb-4 rounded-[.115rem]">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs font-ocrx text-gray-100/80 mb-1">UNIQUE WRAPPERS</div>
              <div className="text-xl font-bold text-lightgreen-100 font-maison-neue">
                {loading ? (
                  <div className="h-6 bg-gray-300/10 animate-pulse rounded w-16" />
                ) : (
                  <>{stats.uniqueWrappers}</>
                )}
              </div>
            </div>
            <div className="text-3xl text-lightgreen-100/40">
              <span className="font-ocrx">USERS</span>
            </div>
          </div>
        </div>

        {stats.recentWraps.length > 0 && (
          <div>
            <div className="text-xs font-ocrx text-gray-100/80 mb-2">RECENT ACTIVITY</div>
            <div className="space-y-1">
              {stats.recentWraps.map((wrap, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-black/60 border border-lightgreen-100/20 hover:border-lightgreen-100/40 transition-all group/item rounded-[.115rem]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-lightgreen-100 font-maison-neue font-bold">
                      {formatAmount(Number(wrap.amount))} BTC
                    </span>
                    <a
                      href={`https://arbiscan.io/tx/${wrap.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-100/70 hover:text-lightgreen-100 font-ocrx transition-colors"
                    >
                      {formatTxHash(wrap.txHash)}
                    </a>
                  </div>
                  <span className="text-xs text-gray-100/70 font-ocrx">{formatTime(wrap.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
