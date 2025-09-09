import { Transaction, TransactionFiltersType, TransactionResponse, NetworkType, TransactionType } from '../types'
import { ArbiscanAPI } from './arbiscanAPI'
import { BitlazerAPI } from './bitlazerAPI'
import { ERC20_CONTRACT_ADDRESS, L2_GATEWAY_ROUTER } from 'src/web3/contracts'
import { cache } from 'src/utils/cache'
import { EXPLORER_CONFIG } from 'src/config/explorer'

// Initialize API clients
const arbiscanAPI = new ArbiscanAPI()
const bitlazerAPI = new BitlazerAPI()

// Cache configuration
const CACHE_CONFIG = {
  TTL: 24 * 60 * 60 * 1000, // 24 hours for main cache
  SHORT_TTL: 5 * 60 * 1000, // 5 minutes for refresh cache to prevent spam
  KEYS: {
    ALL_TRANSACTIONS: 'explorer_all_transactions_v4',
    ARBISCAN_TRANSACTIONS: 'explorer_arbiscan_transactions_v4',
    BITLAZER_TRANSACTIONS: 'explorer_bitlazer_transactions_v4',
  },
}

interface FetchAllTransactionsParams {
  forceRefresh?: boolean
  includeTokenTransfers?: boolean
  includeInternalTransactions?: boolean
  maxTransactionsPerNetwork?: number
}

/**
 * Fetch all transactions from both Arbitrum and Bitlazer networks using explorer APIs
 */
async function fetchAllTransactions(params: FetchAllTransactionsParams = {}): Promise<Transaction[]> {
  const {
    forceRefresh = false,
    includeTokenTransfers = true,
    includeInternalTransactions = false,
    maxTransactionsPerNetwork = 1000,
  } = params

  // For forced refresh, still use short-term cache to prevent API spam
  const cacheKey = forceRefresh ? `${CACHE_CONFIG.KEYS.ALL_TRANSACTIONS}_refresh` : CACHE_CONFIG.KEYS.ALL_TRANSACTIONS
  const cacheTTL = forceRefresh ? CACHE_CONFIG.SHORT_TTL : CACHE_CONFIG.TTL

  // Check cache first
  const cachedData = cache.get<Transaction[]>(cacheKey)
  if (cachedData && cachedData.length > 0) {
    console.log('Using cached transactions data')
    return cachedData
  }

  console.log('Fetching fresh transactions from explorer APIs...')
  const allTransactions: Transaction[] = []

  try {
    // Fetch transactions in parallel from both networks
    const [arbTransactions, bitlazerTransactions] = await Promise.all([
      fetchArbitrumTransactions({
        includeTokenTransfers,
        includeInternalTransactions,
        maxTransactions: maxTransactionsPerNetwork,
        forceRefresh,
      }),
      fetchBitlazerTransactions({
        includeTokenTransfers,
        includeInternalTransactions,
        maxTransactions: maxTransactionsPerNetwork,
        forceRefresh,
      }),
    ])

    allTransactions.push(...arbTransactions, ...bitlazerTransactions)

    // Remove duplicates (same tx hash might appear in multiple categories)
    const uniqueTransactions = Array.from(new Map(allTransactions.map((tx) => [tx.hash, tx])).values())

    // Filter out regular TRANSFER transactions - we only want the main operations
    // Keep only: WRAP, UNWRAP, BRIDGE, STAKE, UNSTAKE
    const filteredTransactions = uniqueTransactions.filter((tx) => tx.type !== TransactionType.TRANSFER)

    // Sort by timestamp (most recent first)
    const sortedTransactions = filteredTransactions.sort((a, b) => b.timestamp - a.timestamp)

    // Cache the results
    cache.set(cacheKey, sortedTransactions, cacheTTL)

    // Also update the main cache if this was a refresh
    if (forceRefresh && sortedTransactions.length > 0) {
      const mainCached = cache.get<Transaction[]>(CACHE_CONFIG.KEYS.ALL_TRANSACTIONS)
      if (!mainCached || mainCached.length === 0) {
        cache.set(CACHE_CONFIG.KEYS.ALL_TRANSACTIONS, sortedTransactions, CACHE_CONFIG.TTL)
      }
    }

    return sortedTransactions
  } catch (error) {
    console.error('Error fetching transactions from explorer APIs:', error)

    // Try to return cached data even if expired
    const expiredCache = cache.get<Transaction[]>(CACHE_CONFIG.KEYS.ALL_TRANSACTIONS)
    if (expiredCache) {
      console.log('Using expired cache due to API error')
      return expiredCache
    }

    return []
  }
}

/**
 * Fetch transactions from Arbitrum network
 */
async function fetchArbitrumTransactions(params: {
  includeTokenTransfers: boolean
  includeInternalTransactions: boolean
  maxTransactions: number
  forceRefresh?: boolean
}): Promise<Transaction[]> {
  const transactions: Transaction[] = []

  try {
    // Fetch different transaction types in parallel
    const promises: Promise<Transaction[]>[] = []

    // 1. Fetch lzrBTC token transfers (wraps, unwraps)
    // This will get mint/burn events which are the actual wrap/unwrap operations
    if (params.includeTokenTransfers) {
      promises.push(
        arbiscanAPI.fetchTokenTransfers({
          contractAddress: ERC20_CONTRACT_ADDRESS.lzrBTC,
          offset: Math.min(params.maxTransactions, EXPLORER_CONFIG.maxPageSize),
          sort: 'desc',
        }),
      )
    }

    // 2. Fetch bridge transactions to L2 Gateway Router
    // These are bridge operations from Arbitrum to Bitlazer
    promises.push(
      arbiscanAPI.fetchTransactions({
        address: L2_GATEWAY_ROUTER,
        offset: Math.min(params.maxTransactions / 2, EXPLORER_CONFIG.maxPageSize),
        sort: 'desc',
      }),
    )

    // We don't need internal transactions for now
    // as they don't represent the main user operations

    const results = await Promise.allSettled(promises)

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        transactions.push(...result.value)
      } else if (result.status === 'rejected') {
        console.error('Failed to fetch Arbitrum transactions:', result.reason)
      }
    })

    // Cache Arbitrum transactions separately with appropriate TTL
    const ttl = params.forceRefresh ? CACHE_CONFIG.SHORT_TTL : CACHE_CONFIG.TTL
    cache.set(CACHE_CONFIG.KEYS.ARBISCAN_TRANSACTIONS, transactions, ttl)

    return transactions
  } catch (error) {
    console.error('Error fetching Arbitrum transactions:', error)

    // Try to use cached data
    const cachedData = cache.get<Transaction[]>(CACHE_CONFIG.KEYS.ARBISCAN_TRANSACTIONS)
    if (cachedData) {
      return cachedData
    }

    return []
  }
}

/**
 * Fetch transactions from Bitlazer network using event logs
 */
async function fetchBitlazerTransactions(params: {
  includeTokenTransfers: boolean
  includeInternalTransactions: boolean
  maxTransactions: number
  forceRefresh?: boolean
}): Promise<Transaction[]> {
  try {
    // Use the new API that fetches via event logs
    const transactions = await bitlazerAPI.fetchAllTransactions(10000) // Last 10k blocks

    // Limit the number of transactions if needed
    const limitedTransactions = transactions.slice(0, params.maxTransactions)

    // Cache Bitlazer transactions with appropriate TTL
    const ttl = params.forceRefresh ? CACHE_CONFIG.SHORT_TTL : CACHE_CONFIG.TTL
    cache.set(CACHE_CONFIG.KEYS.BITLAZER_TRANSACTIONS, limitedTransactions, ttl)

    return limitedTransactions
  } catch (error) {
    console.error('Error fetching Bitlazer transactions:', error)

    // Try to use cached data
    const cachedData = cache.get<Transaction[]>(CACHE_CONFIG.KEYS.BITLAZER_TRANSACTIONS)
    if (cachedData) {
      return cachedData
    }

    return []
  }
}

/**
 * Main export: Fetch transactions with filters
 */
export const fetchTransactions = async (filters: TransactionFiltersType): Promise<TransactionResponse> => {
  // Fetch all transactions (from cache or fresh)
  const allTransactions = await fetchAllTransactions({
    forceRefresh: filters.forceRefresh,
    includeTokenTransfers: true,
    includeInternalTransactions: false,
    maxTransactionsPerNetwork: 2000,
  })

  let filtered = [...allTransactions]

  // Apply filters
  if (filters.query) {
    const query = filters.query.toLowerCase()
    filtered = filtered.filter(
      (tx) =>
        tx.hash.toLowerCase().includes(query) ||
        tx.from.toLowerCase().includes(query) ||
        tx.to.toLowerCase().includes(query),
    )
  }

  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter((tx) => tx.type === filters.type)
  }

  if (filters.network && filters.network !== 'all') {
    filtered = filtered.filter(
      (tx) => tx.sourceNetwork === filters.network || tx.destinationNetwork === filters.network,
    )
  }

  if (filters.status) {
    filtered = filtered.filter((tx) => tx.status === filters.status)
  }

  // Apply date range filters if provided
  if (filters.startDate) {
    const startTimestamp = new Date(filters.startDate).getTime() / 1000
    filtered = filtered.filter((tx) => tx.timestamp >= startTimestamp)
  }

  if (filters.endDate) {
    const endTimestamp = new Date(filters.endDate).getTime() / 1000
    filtered = filtered.filter((tx) => tx.timestamp <= endTimestamp)
  }

  // Pagination
  const start = (filters.page - 1) * filters.limit
  const end = start + filters.limit
  const paginated = filtered.slice(start, end)

  return {
    transactions: paginated,
    total: filtered.length,
    hasMore: end < filtered.length,
  }
}

/**
 * Force refresh all cached data
 */
export const refreshTransactionCache = async (): Promise<void> => {
  cache.delete(CACHE_CONFIG.KEYS.ALL_TRANSACTIONS)
  cache.delete(CACHE_CONFIG.KEYS.ARBISCAN_TRANSACTIONS)
  cache.delete(CACHE_CONFIG.KEYS.BITLAZER_TRANSACTIONS)

  await fetchAllTransactions({ forceRefresh: true })
}

/**
 * Get transaction by hash
 */
export const getTransactionByHash = async (hash: string): Promise<Transaction | null> => {
  const allTransactions = await fetchAllTransactions()
  return allTransactions.find((tx) => tx.hash.toLowerCase() === hash.toLowerCase()) || null
}

/**
 * Get transactions for a specific address
 */
export const getTransactionsByAddress = async (address: string, network?: NetworkType): Promise<Transaction[]> => {
  const allTransactions = await fetchAllTransactions()

  return allTransactions.filter((tx) => {
    const addressMatch =
      tx.from.toLowerCase() === address.toLowerCase() || tx.to.toLowerCase() === address.toLowerCase()

    if (!network) return addressMatch

    return addressMatch && (tx.sourceNetwork === network || tx.destinationNetwork === network)
  })
}
