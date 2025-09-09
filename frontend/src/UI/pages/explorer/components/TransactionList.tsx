import React, { FC, useRef, useCallback } from 'react'
import { TransactionItem } from './TransactionItem'
import { Transaction } from '../types'
import { Skeleton } from '@components/skeleton/Skeleton'
import clsx from 'clsx'

interface TransactionListProps {
  transactions: Transaction[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onSearch?: (query: string) => void
  searchQuery?: string
  nextRefreshIn?: number
}

export const TransactionList: FC<TransactionListProps> = ({
  transactions,
  loading,
  hasMore,
  onLoadMore,
  onSearch,
  searchQuery = '',
  nextRefreshIn,
}) => {
  const [localSearchQuery, setLocalSearchQuery] = React.useState(searchQuery)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Debounced search function
  const handleSearch = useCallback(
    (value: string) => {
      setLocalSearchQuery(value)

      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      // Set new timer for debounced search
      debounceTimer.current = setTimeout(() => {
        onSearch?.(value)
      }, 250)
    },
    [onSearch],
  )

  const handleClear = () => {
    setLocalSearchQuery('')
    onSearch?.('')
  }

  React.useEffect(() => {
    setLocalSearchQuery(searchQuery)
  }, [searchQuery])

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])
  return (
    <div className="relative group w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-lightgreen-100/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative bg-gradient-to-br from-darkslategray-200/90 via-darkslategray-200/80 to-lightgreen-100/10 backdrop-blur-sm border border-lightgreen-100 p-4 md:p-5 hover:border-lightgreen-100 hover:shadow-[0_0_20px_rgba(102,213,96,0.2)] transition-all duration-300 rounded-[.115rem]">
        {/* Search Bar - Always visible */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="search"
              value={localSearchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by transaction hash or address..."
              className={clsx(
                'w-full bg-black/55 backdrop-blur-sm border-2 border-lightgreen-100/25',
                'text-white font-maison-neue text-base',
                'px-4 py-3 pr-12 rounded-[.115rem]',
                'placeholder:text-white/50 placeholder:font-maison-neue placeholder:text-xs md:placeholder:text-sm',
                'focus:outline-none focus:border-lightgreen-100/50 focus:bg-black/60',
                'hover:border-lightgreen-100/40 hover:bg-black/65',
                'shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]',
                'transition-all duration-200',
                // Hide native search clear button
                '[&::-webkit-search-cancel-button]:hidden',
                '[&::-webkit-search-cancel-button]:appearance-none',
              )}
            />
            {/* Search/Clear Icon */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {localSearchQuery ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-white/50 hover:text-lightgreen-100 transition-colors duration-200"
                  aria-label="Clear search"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white/30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && transactions.length === 0 && (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="bg-black/60 border border-lightgreen-100/20 rounded-[.115rem] p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-6 w-28" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results State */}
        {!loading && transactions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-white/70 font-maison-neue text-lg mb-2">No transactions found</p>
            <p className="text-white/50 font-maison-neue text-sm">Try adjusting your filters or search query</p>
          </div>
        )}

        {/* Transactions List */}
        {transactions.length > 0 && (
          <>
            {/* Desktop Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 pb-4 border-b border-lightgreen-100/30 mb-4">
              <div className="col-span-1 font-ocrx text-lightgreen-100 text-base uppercase">Type</div>
              <div className="col-span-2 font-ocrx text-lightgreen-100 text-base uppercase">From</div>
              <div className="col-span-2 font-ocrx text-lightgreen-100 text-base uppercase">Hash</div>
              <div className="col-span-2 font-ocrx text-lightgreen-100 text-base uppercase">Amount</div>
              <div className="col-span-1 font-ocrx text-lightgreen-100 text-base uppercase">Block</div>
              <div className="col-span-2 font-ocrx text-lightgreen-100 text-base uppercase">Network</div>
              <div className="col-span-1 font-ocrx text-lightgreen-100 text-base uppercase">Status</div>
              <div className="col-span-1 font-ocrx text-lightgreen-100 text-base uppercase text-right flex items-center justify-end gap-2">
                <span>Time</span>
                {nextRefreshIn !== undefined && (
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 -rotate-90 text-white/50" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="6" opacity="0.25" />
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeLinecap="round"
                        fill="none"
                        style={{
                          strokeDasharray: `${(nextRefreshIn / 30) * 62.8}px, 62.8px`,
                          transition: 'stroke-dasharray 1s linear',
                        }}
                      />
                    </svg>
                    <span className="text-xs font-maison-neue font-bold normal-case">{nextRefreshIn}s</span>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Items */}
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} nextRefreshIn={nextRefreshIn} />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={onLoadMore}
                  disabled={loading}
                  className={clsx(
                    'bg-lightgreen-100 text-black',
                    'font-ocrx text-sm uppercase',
                    'px-6 py-2 rounded-[.115rem]',
                    'hover:bg-lightgreen-100/90',
                    'transition-all duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
