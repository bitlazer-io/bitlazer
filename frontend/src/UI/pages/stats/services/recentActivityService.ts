import { fetchTransactions } from '../../explorer/services/transactionService'
import { TransactionType, NetworkType } from '../../explorer/types'
import { cache } from 'src/utils/cache'

// Cache configuration for recent activity (1 minute cache for fresh data)
const CACHE_TTL = 60 * 1000 // 1 minute

interface WrapActivity {
  amount: string
  timestamp: number
  txHash: string
  asset: string
  type: 'wrap' | 'unwrap'
}

interface BridgeActivity {
  amount: string
  from: string
  to: string
  txHash: string
  timestamp: number
  asset: string
}

interface StakingActivity {
  amount: string
  action: 'stake' | 'unstake'
  txHash: string
  timestamp: number
  asset: string
}

/**
 * Fetch recent wrap/unwrap activity using Explorer service
 */
export async function fetchRecentWrapActivity(limit: number = 5): Promise<WrapActivity[]> {
  const cacheKey = `recent_wrap_activity_${limit}`

  // Check cache first
  const cached = cache.get<WrapActivity[]>(cacheKey)
  if (cached) {
    return cached
  }

  try {
    // Fetch transactions from Explorer service
    const response = await fetchTransactions({
      page: 1,
      limit: 100,
      forceRefresh: false,
    })

    const wrapActivity: WrapActivity[] = []

    for (const tx of response.transactions) {
      // Only wrap and unwrap transactions
      if (tx.type === TransactionType.WRAP || tx.type === TransactionType.UNWRAP) {
        wrapActivity.push({
          amount: tx.amount,
          timestamp: tx.timestamp,
          txHash: tx.hash,
          asset: tx.asset,
          type: tx.type === TransactionType.WRAP ? 'wrap' : 'unwrap',
        })
      }
    }

    // Sort by timestamp descending and limit
    wrapActivity.sort((a, b) => b.timestamp - a.timestamp)
    const limited = wrapActivity.slice(0, limit)

    cache.set(cacheKey, limited, CACHE_TTL)
    return limited
  } catch (error) {
    console.error('Error fetching recent wrap activity from Explorer service:', error)
    return []
  }
}

/**
 * Fetch recent bridge activity using Explorer service
 */
export async function fetchRecentBridgeActivity(limit: number = 5): Promise<BridgeActivity[]> {
  const cacheKey = `recent_bridge_activity_${limit}`

  // Check cache first
  const cached = cache.get<BridgeActivity[]>(cacheKey)
  if (cached) {
    return cached
  }

  try {
    // Fetch transactions from Explorer service
    const response = await fetchTransactions({
      page: 1,
      limit: 100,
      forceRefresh: false,
    })

    const bridgeActivity: BridgeActivity[] = []

    for (const tx of response.transactions) {
      // Only bridge transactions
      if (tx.type === TransactionType.BRIDGE) {
        const fromNetwork = tx.sourceNetwork === NetworkType.ARBITRUM ? 'Arbitrum' : 'Bitlazer L3'
        const toNetwork = tx.destinationNetwork === NetworkType.BITLAZER ? 'Bitlazer L3' : 'Arbitrum'

        bridgeActivity.push({
          amount: tx.amount,
          from: fromNetwork,
          to: toNetwork,
          txHash: tx.hash,
          timestamp: tx.timestamp,
          asset: tx.asset,
        })
      }
    }

    // Sort by timestamp descending and limit
    bridgeActivity.sort((a, b) => b.timestamp - a.timestamp)
    const limited = bridgeActivity.slice(0, limit)

    cache.set(cacheKey, limited, CACHE_TTL)
    return limited
  } catch (error) {
    console.error('Error fetching recent bridge activity from Explorer service:', error)
    return []
  }
}

/**
 * Fetch recent staking activity using Explorer service
 */
export async function fetchRecentStakingActivity(limit: number = 5): Promise<StakingActivity[]> {
  const cacheKey = `recent_staking_activity_${limit}`

  // Check cache first
  const cached = cache.get<StakingActivity[]>(cacheKey)
  if (cached) {
    return cached
  }

  try {
    // Fetch transactions from Explorer service
    const response = await fetchTransactions({
      page: 1,
      limit: 100,
      forceRefresh: false,
    })

    const stakingActivity: StakingActivity[] = []

    for (const tx of response.transactions) {
      // Only stake and unstake transactions
      if (tx.type === TransactionType.STAKE || tx.type === TransactionType.UNSTAKE) {
        stakingActivity.push({
          amount: tx.amount,
          action: tx.type === TransactionType.STAKE ? 'stake' : 'unstake',
          txHash: tx.hash,
          timestamp: tx.timestamp,
          asset: tx.asset,
        })
      }
    }

    // Sort by timestamp descending and limit
    stakingActivity.sort((a, b) => b.timestamp - a.timestamp)
    const limited = stakingActivity.slice(0, limit)

    cache.set(cacheKey, limited, CACHE_TTL)
    return limited
  } catch (error) {
    console.error('Error fetching recent staking activity from Explorer service:', error)
    return []
  }
}
