import React, { FC, useState, useEffect } from 'react'
import { TypewriterText } from '@components/common/TypewriterText'
import { TransactionList } from './components/TransactionList'
import { TransactionFilters } from './components/TransactionFilters'
import { fetchTransactions } from './services/transactionService'
import { Transaction, TransactionType, NetworkType } from './types'
import { cache } from 'src/utils/cache'

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
  const itemsPerPage = 20

  // Fetch all transactions only once on mount
  useEffect(() => {
    loadAllTransactions()
  }, [])

  // Apply filters when search/filter criteria change
  useEffect(() => {
    applyFilters()
  }, [searchQuery, selectedType, selectedNetwork, allTransactions])

  // Handle pagination
  useEffect(() => {
    const start = 0
    const end = page * itemsPerPage
    setDisplayedTransactions(filteredTransactions.slice(start, end))
    setHasMore(end < filteredTransactions.length)
  }, [page, filteredTransactions])

  const loadAllTransactions = async () => {
    const CACHE_KEY = 'explorer_transactions'
    const CACHE_TTL = 60 * 1000 // 1 minute cache

    // Try to get cached data first
    const cachedData = cache.get<Transaction[]>(CACHE_KEY)
    if (cachedData) {
      setAllTransactions(cachedData)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const data = await fetchTransactions({
        page: 1,
        limit: 1000, // Fetch all available transactions
      })

      // Cache the transactions
      cache.set(CACHE_KEY, data.transactions, CACHE_TTL)
      setAllTransactions(data.transactions)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
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
      filtered = filtered.filter(
        (tx) => tx.sourceNetwork === selectedNetwork || tx.destinationNetwork === selectedNetwork,
      )
    }

    setFilteredTransactions(filtered)
    setPage(1) // Reset to first page when filters change
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
                  text="Track all Bitlazer ecosystem transactions in real-time"
                  delay={30}
                  initialDelay={100}
                  cursor={true}
                  cursorChar="_"
                />
              ) : (
                <span className="opacity-0">Track all Bitlazer ecosystem transactions in real-time</span>
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
          />
        </div>
      </div>
    </div>
  )
}

export default Explorer
