import React, { FC } from 'react'
import { Controller, Control } from 'react-hook-form'
import clsx from 'clsx'

interface TokenInfo {
  symbol: string
  icon: string
  chain: string
}

interface TokenCardProps {
  type: 'from' | 'to'
  tokenInfo: TokenInfo
  balance?: string
  isBalanceLoading?: boolean
  isInputFocused?: boolean
  onInputFocus?: () => void
  onInputBlur?: () => void
  onPercentageClick?: (percentage: number) => void
  control?: Control<any>
  amount?: string
  rules?: any
  isReadOnly?: boolean
  usdValue?: string
  showPercentageButtons?: boolean
}

const TokenCard: FC<TokenCardProps> = ({
  type,
  tokenInfo,
  balance = '0',
  isBalanceLoading = false,
  isInputFocused = false,
  onInputFocus,
  onInputBlur,
  onPercentageClick,
  control,
  amount = '0',
  rules,
  isReadOnly = false,
  usdValue = '$0.00',
  showPercentageButtons = true,
}) => {
  const isFrom = type === 'from'

  return (
    <div className="relative">
      <div className="relative bg-darkslategray-200 border border-lightgreen-100/50 hover:border-lightgreen-100 transition-all duration-300 rounded-[.115rem] p-4 overflow-visible">
        <div className="flex justify-between items-center mb-3">
          <span className="text-white/70 text-sm font-maison-neue">{isFrom ? 'From' : 'To'}</span>
          <div className="relative h-6 w-[160px] flex items-center justify-end">
            {isFrom && showPercentageButtons && isInputFocused ? (
              <div className="flex items-center gap-1 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => onPercentageClick?.(25)}
                  className="px-2 py-1 text-xs font-bold text-lightgreen-100 hover:bg-lightgreen-100/10 rounded transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => onPercentageClick?.(50)}
                  className="px-2 py-1 text-xs font-bold text-lightgreen-100 hover:bg-lightgreen-100/10 rounded transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => onPercentageClick?.(100)}
                  className="px-2 py-1 text-xs font-bold text-lightgreen-100 hover:bg-lightgreen-100/10 rounded transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  MAX
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => isFrom && showPercentageButtons && onPercentageClick?.(100)}
                className={clsx(
                  'flex items-center gap-2 animate-fadeIn',
                  isFrom && showPercentageButtons && 'hover:scale-105 active:scale-95 cursor-pointer',
                )}
              >
                {/* Wallet icon */}
                <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                </svg>
                <span className="text-white/50 text-xs font-maison-neue">{isBalanceLoading ? '...' : balance}</span>
              </button>
            )}
          </div>
        </div>

        {/* Token and Amount container */}
        <div
          className={clsx(
            'bg-black/40 rounded-lg p-3 border transition-all duration-150',
            isFrom && isInputFocused
              ? 'border-lightgreen-100 shadow-[0_0_12px_rgba(102,213,96,0.25)] scale-[1.01]'
              : 'border-lightgreen-100/20',
            isFrom && 'hover:border-lightgreen-100/40',
          )}
        >
          <div className="flex items-center justify-between">
            {/* Token Display */}
            <div className="flex items-center gap-2">
              <img src={tokenInfo.icon} alt={tokenInfo.symbol} className="w-8 h-8 flex-shrink-0" />
              <div className="flex flex-col">
                <span className={clsx('text-white font-bold text-base', isFrom && 'transition-colors duration-200')}>
                  {tokenInfo.symbol}
                </span>
                <span
                  className={clsx(
                    'text-xs',
                    isFrom
                      ? 'text-red-500' // Bright red for From network
                      : 'text-lightgreen-100', // Green for To network
                  )}
                >
                  {tokenInfo.chain}
                </span>
              </div>
            </div>

            {/* Amount Input/Display */}
            <div className="flex flex-col items-end flex-1 min-w-0">
              {isFrom && control ? (
                <>
                  <Controller
                    name="amount"
                    control={control}
                    rules={rules}
                    render={({ field }) => (
                      <input
                        {...field}
                        value={field.value && field.value !== '0' ? `-${field.value}` : field.value}
                        onChange={(e) => {
                          const value = e.target.value.replace(/^-/, '')
                          field.onChange(value)
                        }}
                        type="text"
                        placeholder="0"
                        className={clsx(
                          'bg-transparent text-white text-xl font-bold placeholder:text-white/30',
                          'focus:outline-none text-right w-full overflow-hidden text-ellipsis',
                        )}
                        onFocus={onInputFocus}
                        onBlur={() => setTimeout(onInputBlur || (() => {}), 200)}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        readOnly={isReadOnly}
                      />
                    )}
                  />
                  {/* USD Value inside the card */}
                  <div className="text-white/40 text-xs mt-1 truncate w-full text-right">≈ {usdValue}</div>
                </>
              ) : (
                <>
                  <div className="text-white text-xl font-bold truncate w-full text-right">
                    {amount && amount !== '0' ? (
                      <>
                        {isFrom ? '-' : '+'}
                        {amount}
                      </>
                    ) : (
                      <span className="text-white/30">0</span>
                    )}
                  </div>
                  {/* USD Value or custom text inside the card */}
                  <div className="text-white/40 text-xs mt-1 truncate w-full text-right">≈ {usdValue}</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TokenCard
