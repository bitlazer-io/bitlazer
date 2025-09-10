import React, { FC, useState, useEffect, useRef } from 'react'
import { TypewriterText } from '@components/common/TypewriterText'
import { TransactionList } from './components/TransactionList'
import { TransactionFilters } from './components/TransactionFilters'
import { fetchTransactions } from './services/transactionService'
import { Transaction, TransactionType, NetworkType } from './types'
import { cache } from 'src/utils/cache'
import { ArbiscanAPI } from './services/arbiscanAPI'
import { BitlazerAPI } from './services/bitlazerAPI'

interface IExplorer {}

const Explorer: FC<IExplorer> = () => {
  const [titleComplete, setTitleComplete] = useState(false)
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [displayedTransactions, setDisplayedTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all')
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType | 'all'>('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [nextRefreshIn, setNextRefreshIn] = useState(30)
  const itemsPerPage = 20
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialLoadComplete = useRef<boolean>(false)

  // Auto-refresh: check for new txs and update recent ones
  const refreshRecentTransactions = async () => {
    if (!isInitialLoadComplete.current) return

    try {
      const arbiscanAPI = new ArbiscanAPI()
      const bitlazerAPI = new BitlazerAPI()

      // Fetch recent transactions (last ~24h worth)
      const [arbTxs, bitlazerTxs] = await Promise.all([
        arbiscanAPI.fetchTokenTransfers({
          contractAddress: '0x0c978B2F8F3A0E399DaF5C41e4776757253EE5Df',
          offset: 10000, // 10k transactions from Arbitrum (high activity)
          sort: 'desc',
        }),
        bitlazerAPI.fetchAllTransactionsLightweight(10), // Use lightweight version for auto-refresh
      ])

      // Combine and filter
      const fresh = [...arbTxs, ...bitlazerTxs].filter((tx) => tx.type !== TransactionType.TRANSFER)

      // Create map of current transactions
      const txMap = new Map(allTransactions.map((tx) => [tx.hash, tx]))

      // Update existing or add new
      fresh.forEach((tx) => {
        txMap.set(tx.hash, tx)
      })

      // Sort and update state
      const updated = Array.from(txMap.values()).sort((a, b) => b.timestamp - a.timestamp)

      setAllTransactions(updated)

      // Update cache
      cache.set('explorer_all_transactions_v5', updated, 12 * 60 * 60 * 1000)

      console.log(`Auto-refresh: checked ${fresh.length} recent txs, total: ${updated.length}`)
    } catch (error) {
      console.error('Auto-refresh failed:', error)
    }
  }

  // Initial load on mount
  useEffect(() => {
    loadAllTransactions()
  }, [])

  // Set up auto-refresh countdown (30 seconds)
  useEffect(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }

    let countdown = 30 // 30 seconds
    setNextRefreshIn(countdown)

    countdownIntervalRef.current = setInterval(() => {
      countdown -= 1
      if (countdown <= 0) {
        countdown = 30
        // Use cache-free refresh for recent transactions
        refreshRecentTransactions()
      }
      setNextRefreshIn(countdown)
    }, 1000)

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, []) // Empty dependency is OK here since refreshRecentTransactions uses ref

  // Apply filters when search/filter criteria change
  useEffect(() => {
    applyFilters(false)
  }, [allTransactions])

  useEffect(() => {
    applyFilters(true) // Reset page on user filter changes
  }, [searchQuery, selectedType, selectedNetwork])

  // Handle pagination
  useEffect(() => {
    const start = 0
    const end = page * itemsPerPage
    setDisplayedTransactions(filteredTransactions.slice(start, end))
    setHasMore(end < filteredTransactions.length)
  }, [page, filteredTransactions])

  const loadAllTransactions = async () => {
    const CACHE_KEY = 'explorer_all_transactions_v5'
    const CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours

    // Try cache first
    const cachedData = cache.get<Transaction[]>(CACHE_KEY)
    if (cachedData && cachedData.length > 0) {
      console.log(`Initial load: Using ${cachedData.length} cached transactions`)
      setAllTransactions(cachedData)
      setLoading(false)
      isInitialLoadComplete.current = true
      return
    }

    // No cache, fetch all from API
    setLoading(true)

    try {
      const data = await fetchTransactions({
        page: 1,
        limit: 5000, // Get all transactions
        forceRefresh: false,
      })

      console.log(`Initial load: Fetched ${data.transactions.length} transactions from API`)
      setAllTransactions(data.transactions)
      cache.set(CACHE_KEY, data.transactions, CACHE_TTL)
      isInitialLoadComplete.current = true
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      isInitialLoadComplete.current = true // Allow auto-refresh even on error
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = (resetPage = false) => {
    let filtered = [...allTransactions]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (tx) =>
          tx.hash.toLowerCase().includes(query) ||
          tx.from.toLowerCase().includes(query) ||
          tx.to.toLowerCase().includes(query),
      )
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter((tx) => tx.type === selectedType)
    }

    // Apply network filter
    if (selectedNetwork !== 'all') {
      filtered = filtered.filter((tx) => tx.sourceNetwork === selectedNetwork)
    }

    setFilteredTransactions(filtered)

    // Only reset to first page if explicitly requested (user-initiated filter change)
    if (resetPage) {
      setPage(1)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleTypeFilter = (type: TransactionType | 'all') => {
    setSelectedType(type)
  }

  const handleNetworkFilter = (network: NetworkType | 'all') => {
    setSelectedNetwork(network)
  }

  const handleLoadMore = () => {
    if (hasMore) {
      setPage((prev) => prev + 1)
    }
  }

  return (
    <div className="w-full min-h-screen relative overflow-hidden flex flex-col pt-20 pb-32 md:pt-28 md:pb-24">
      <div className="container px-4 md:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 md:gap-6 md:pointer-events-auto md:[&_*]:pointer-events-auto">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-3xl md:text-6xl lg:text-7xl font-ocrx text-lightgreen-100 tracking-[-0.06em] mb-1">
              <TypewriterText
                text="TRANSACTION EXPLORER"
                delay={50}
                initialDelay={200}
                cursor={!titleComplete}
                cursorChar="▮"
                onComplete={() => setTitleComplete(true)}
              />
            </h1>
            <p className="text-base md:text-xl text-white font-maison-neue min-h-[1.5rem] md:min-h-[1.75rem]">
              {titleComplete ? (
                <TypewriterText
                  text="Track all Bitlazer ecosystem transactions"
                  delay={30}
                  initialDelay={100}
                  cursor={true}
                  cursorChar="_"
                />
              ) : (
                <span className="opacity-0">Track all Bitlazer ecosystem transactions</span>
              )}
            </p>
          </div>

          {/* Filters */}
          <div className="relative group w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-lightgreen-100/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-gradient-to-br from-darkslategray-200/90 via-darkslategray-200/80 to-lightgreen-100/10 backdrop-blur-sm border border-lightgreen-100 p-4 md:p-5 hover:border-lightgreen-100 hover:shadow-[0_0_20px_rgba(102,213,96,0.2)] transition-all duration-300 rounded-[.115rem]">
              <TransactionFilters
                selectedType={selectedType}
                selectedNetwork={selectedNetwork}
                onTypeChange={handleTypeFilter}
                onNetworkChange={handleNetworkFilter}
              />
            </div>
          </div>

          {/* Transaction List with integrated Search */}
          <TransactionList
            transactions={displayedTransactions}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onSearch={handleSearch}
            searchQuery={searchQuery}
            nextRefreshIn={nextRefreshIn}
          />
        </div>
      </div>
    </div>
  )
}

export default Explorer
