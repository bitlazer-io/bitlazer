import React, { FC } from 'react'
import clsx from 'clsx'
import { Transaction, TransactionType, TransactionStatus, NetworkType } from '../types'
import { formatTxHash, formatAddress } from 'src/utils/formatters'
import { SUPPORTED_CHAINS } from 'src/web3/chains'

interface TransactionItemProps {
  transaction: Transaction
  nextRefreshIn?: number
}

export const TransactionItem: FC<TransactionItemProps> = ({ transaction }) => {
  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case TransactionType.WRAP:
      case TransactionType.UNWRAP:
        return 'text-yellow-400'
      case TransactionType.BRIDGE:
        return 'text-blue-400'
      case TransactionType.STAKE:
      case TransactionType.UNSTAKE:
        return 'text-fuchsia'
      default:
        return 'text-white'
    }
  }

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.CONFIRMED:
        return 'text-lightgreen-100'
      case TransactionStatus.PENDING:
        return 'text-yellow-400'
      case TransactionStatus.FAILED:
        return 'text-red-400'
      default:
        return 'text-white'
    }
  }

  const formatAmount = (amount: string, asset: string) => {
    const num = parseFloat(amount)
    if (num < 0.0001) return `<0.0001 ${asset}`
    if (num < 1) return `${num.toFixed(6)} ${asset}`
    if (num < 1000) return `${num.toFixed(4)} ${asset}`
    return `${num.toFixed(2)} ${asset}`
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now() / 1000
    const diff = now - timestamp
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const getAddressExplorerUrl = (address: string, network: NetworkType) => {
    if (network === NetworkType.ARBITRUM) {
      return `https://arbiscan.io/address/${address}`
    }
    return `https://bitlazer.calderaexplorer.xyz/address/${address}`
  }

  const getNetworkIcon = (network: NetworkType) => {
    const chainMetadata = network === NetworkType.ARBITRUM ? SUPPORTED_CHAINS.arbitrumOne : SUPPORTED_CHAINS.bitlazerL3

    return <img src={chainMetadata.icon} alt={chainMetadata.name} className="w-5 h-5 inline-block mr-1" />
  }

  return (
    <div
      className={clsx(
        'relative border border-lightgreen-100/30 rounded-[.115rem] p-4',
        'hover:bg-black/50',
        'hover:border-lightgreen-100/60',
        'transition-all duration-300 ease-out',
        'group',
      )}
    >
      {/* Desktop View */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 items-center relative z-10">
        {/* Type */}
        <div className="col-span-1">
          <span className={clsx('font-ocrx text-base uppercase', getTypeColor(transaction.type))}>
            {transaction.type}
          </span>
        </div>

        {/* From Address */}
        <div className="col-span-2">
          <a
            href={getAddressExplorerUrl(transaction.from, transaction.sourceNetwork)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-lightgreen-100 hover:underline font-maison-neue text-base truncate inline-block transition-colors duration-200 cursor-pointer"
            title={transaction.from}
            onClick={(e) => e.stopPropagation()}
          >
            {formatAddress(transaction.from)}
          </a>
        </div>

        {/* Hash */}
        <div className="col-span-2">
          <a
            href={transaction.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-lightgreen-100 hover:underline transition-colors font-maison-neue text-base cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            {formatTxHash(transaction.hash)}
          </a>
        </div>

        {/* Amount */}
        <div className="col-span-2">
          <span className="text-white font-maison-neue text-base font-semibold whitespace-nowrap">
            {formatAmount(transaction.amount, transaction.asset)}
          </span>
        </div>

        {/* Block */}
        <div className="col-span-1">
          <span className="text-white/70 font-maison-neue text-base">
            {transaction.blockNumber ? `#${transaction.blockNumber}` : '-'}
          </span>
        </div>

        {/* Network */}
        <div className="col-span-2">
          <div className="flex items-center text-white/70 font-maison-neue text-base">
            {getNetworkIcon(transaction.sourceNetwork)}
            <span className="capitalize ml-1">{transaction.sourceNetwork}</span>
          </div>
        </div>

        {/* Status */}
        <div className="col-span-1">
          <span className={clsx('font-ocrx text-base uppercase', getStatusColor(transaction.status))}>
            {transaction.status}
          </span>
        </div>

        {/* Time */}
        <div className="col-span-1 text-right">
          <span className="text-white/50 font-maison-neue text-base">{formatTime(transaction.timestamp)}</span>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-2 relative z-10">
        <div className="flex justify-between items-start">
          <span className={clsx('font-ocrx text-sm uppercase', getTypeColor(transaction.type))}>
            {transaction.type}
          </span>
          <span className={clsx('font-ocrx text-xs uppercase', getStatusColor(transaction.status))}>
            {transaction.status}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <a
            href={transaction.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-lightgreen-100 hover:underline transition-colors font-maison-neue text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {formatTxHash(transaction.hash)}
          </a>
          <span className="text-white/50 font-maison-neue text-sm">{formatTime(transaction.timestamp)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-white/50 font-maison-neue text-sm">From:</span>
          <a
            href={getAddressExplorerUrl(transaction.from, transaction.sourceNetwork)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-lightgreen-100 hover:underline font-maison-neue text-sm transition-colors duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {formatAddress(transaction.from)}
          </a>
        </div>

        <div className="border-t border-lightgreen-100/20 pt-2">
          <div className="text-white font-maison-neue text-sm font-semibold mb-1">
            {formatAmount(transaction.amount, transaction.asset)}
          </div>
          <div className="flex items-center text-white/70 font-maison-neue text-sm">
            {getNetworkIcon(transaction.sourceNetwork)}
            <span className="capitalize">{transaction.sourceNetwork}</span>
            {transaction.destinationNetwork && (
              <>
                <span className="mx-1">→</span>
                {getNetworkIcon(transaction.destinationNetwork)}
                <span className="capitalize">{transaction.destinationNetwork}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
