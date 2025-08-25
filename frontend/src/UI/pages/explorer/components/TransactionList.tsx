import React, { FC } from 'react'
import { TransactionItem } from './TransactionItem'
import { Transaction } from '../types'
import { Skeleton } from '@components/skeleton/Skeleton'
import clsx from 'clsx'

interface TransactionListProps {
  transactions: Transaction[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
}

export const TransactionList: FC<TransactionListProps> = ({ transactions, loading, hasMore, onLoadMore }) => {
  if (loading && transactions.length === 0) {
    return (
      <div className="relative group w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-lightgreen-100/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative bg-gradient-to-br from-darkslategray-200/90 via-darkslategray-200/80 to-lightgreen-100/10 backdrop-blur-sm border border-lightgreen-100 p-4 md:p-5 hover:border-lightgreen-100 hover:shadow-[0_0_20px_rgba(102,213,96,0.2)] transition-all duration-300 rounded-[.115rem]">
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
        </div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="relative group w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-lightgreen-100/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative bg-gradient-to-br from-darkslategray-200/90 via-darkslategray-200/80 to-lightgreen-100/10 backdrop-blur-sm border border-lightgreen-100 p-4 md:p-5 hover:border-lightgreen-100 hover:shadow-[0_0_20px_rgba(102,213,96,0.2)] transition-all duration-300 rounded-[.115rem]">
          <div className="text-center py-8">
            <p className="text-white/70 font-maison-neue text-lg mb-2">No transactions found</p>
            <p className="text-white/50 font-maison-neue text-sm">Try adjusting your filters or search query</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative group w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-lightgreen-100/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative bg-gradient-to-br from-darkslategray-200/90 via-darkslategray-200/80 to-lightgreen-100/10 backdrop-blur-sm border border-lightgreen-100 p-4 md:p-5 hover:border-lightgreen-100 hover:shadow-[0_0_20px_rgba(102,213,96,0.2)] transition-all duration-300 rounded-[.115rem]">
        {/* Desktop Header */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 pb-4 border-b border-lightgreen-100/30 mb-4">
          <div className="col-span-2 font-ocrx text-lightgreen-100 text-sm uppercase">Type</div>
          <div className="col-span-2 font-ocrx text-lightgreen-100 text-sm uppercase">Hash</div>
          <div className="col-span-2 font-ocrx text-lightgreen-100 text-sm uppercase">From → To</div>
          <div className="col-span-2 font-ocrx text-lightgreen-100 text-sm uppercase">Amount</div>
          <div className="col-span-2 font-ocrx text-lightgreen-100 text-sm uppercase">Network</div>
          <div className="col-span-1 font-ocrx text-lightgreen-100 text-sm uppercase">Status</div>
          <div className="col-span-1 font-ocrx text-lightgreen-100 text-sm uppercase">Time</div>
        </div>

        {/* Transaction Items */}
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
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
      </div>
    </div>
  )
}
