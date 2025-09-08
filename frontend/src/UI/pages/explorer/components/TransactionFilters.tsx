import React, { FC } from 'react'
import clsx from 'clsx'
import { TransactionType, NetworkType } from '../types'
import { SUPPORTED_CHAINS } from 'src/web3/chains'

interface TransactionFiltersProps {
  selectedType: TransactionType | 'all'
  selectedNetwork: NetworkType | 'all'
  onTypeChange: (type: TransactionType | 'all') => void
  onNetworkChange: (network: NetworkType | 'all') => void
}

export const TransactionFilters: FC<TransactionFiltersProps> = ({
  selectedType,
  selectedNetwork,
  onTypeChange,
  onNetworkChange,
}) => {
  const typeOptions: Array<{ value: TransactionType | 'all'; label: string }> = [
    { value: 'all', label: 'All Types' },
    { value: TransactionType.WRAP, label: 'Wrap' },
    { value: TransactionType.UNWRAP, label: 'Unwrap' },
    { value: TransactionType.BRIDGE, label: 'Bridge' },
    { value: TransactionType.STAKE, label: 'Stake' },
    { value: TransactionType.UNSTAKE, label: 'Unstake' },
  ]

  const networkOptions: Array<{ value: NetworkType | 'all'; label: string }> = [
    { value: 'all', label: 'All Networks' },
    { value: NetworkType.ARBITRUM, label: SUPPORTED_CHAINS.arbitrumOne.name },
    { value: NetworkType.BITLAZER, label: SUPPORTED_CHAINS.bitlazerL3.name },
  ]

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1">
        <label className="block text-lightgreen-100 font-ocrx text-base uppercase mb-2">Transaction Type</label>
        <div className="flex flex-wrap gap-2">
          {typeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onTypeChange(option.value)}
              className={clsx(
                'px-3 py-1 rounded-[.115rem] font-ocrx text-sm uppercase',
                'transition-all duration-200',
                selectedType === option.value
                  ? 'bg-lightgreen-100 text-black'
                  : 'bg-black/60 text-white border border-lightgreen-100/30 hover:border-lightgreen-100',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-lightgreen-100 font-ocrx text-base uppercase mb-2">Network</label>
        <div className="flex flex-wrap gap-2">
          {networkOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onNetworkChange(option.value)}
              className={clsx(
                'px-3 py-1 rounded-[.115rem] font-ocrx text-sm uppercase',
                'transition-all duration-200 flex items-center gap-2',
                selectedNetwork === option.value
                  ? 'bg-lightgreen-100 text-black'
                  : 'bg-black/60 text-white border border-lightgreen-100/30 hover:border-lightgreen-100',
              )}
            >
              {option.value === NetworkType.ARBITRUM && (
                <img
                  src={SUPPORTED_CHAINS.arbitrumOne.icon}
                  alt={SUPPORTED_CHAINS.arbitrumOne.name}
                  className="w-4 h-4"
                />
              )}
              {option.value === NetworkType.BITLAZER && (
                <img
                  src={SUPPORTED_CHAINS.bitlazerL3.icon}
                  alt={SUPPORTED_CHAINS.bitlazerL3.name}
                  className={clsx('w-4 h-4', selectedNetwork === option.value ? 'opacity-100' : 'opacity-70')}
                />
              )}
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
