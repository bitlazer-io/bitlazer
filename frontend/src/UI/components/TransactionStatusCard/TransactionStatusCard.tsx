import React, { FC, useEffect, useState } from 'react'
import clsx from 'clsx'
import { PendingTransaction, TRANSACTION_STAGES } from '../../../types/transactions'
import TransactionDetailsModal from '../TransactionDetailsModal/TransactionDetailsModal'
import { fmtHash } from '../../../utils/fmt'
import { formatElapsedTime } from '../../../utils/time'

interface TransactionStatusCardProps {
  transaction: PendingTransaction
  onClose?: () => void
  className?: string
}

const TransactionStatusCard: FC<TransactionStatusCardProps> = ({ transaction, className }) => {
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [showModal, setShowModal] = useState(false)

  // Update time elapsed every minute
  useEffect(() => {
    const updateTimeElapsed = () => {
      const elapsed = Math.floor((Date.now() - transaction.timestamp) / (1000 * 60))
      setTimeElapsed(elapsed)
    }

    updateTimeElapsed()
    const interval = setInterval(updateTimeElapsed, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [transaction.timestamp])

  const getActionLabel = () => {
    switch (transaction.type) {
      case 'bridge':
        return `Bridging to ${transaction.toChain}`
      case 'bridge-reverse':
        return `Withdrawing to ${transaction.toChain}`
      case 'wrap':
        return 'Wrapping'
      case 'unwrap':
        return 'Unwrapping'
      case 'stake':
        return 'Staking'
      case 'unstake':
        return 'Unstaking'
      default:
        return 'Processing'
    }
  }

  // Get current and previous stages for simplified display
  const stages = TRANSACTION_STAGES[transaction.type] || []
  const currentStageIndex = stages.findIndex((stage) => stage.stage === transaction.stage)
  const lastTwoStages = stages.slice(Math.max(0, currentStageIndex - 1), currentStageIndex + 1)

  return (
    <>
      <div className={clsx('w-full', className)}>
        <div
          className={clsx(
            'relative overflow-hidden rounded-[.115rem] border transition-all duration-300',
            'bg-gradient-to-r from-darkslategray-200/95 to-darkslategray-200/80',
            'backdrop-blur-sm border-lightgreen-100/30',
          )}
        >
          <div className="p-3">
            {/* Row 1: Title with icon and Time */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <img src="/icons/crypto/arbitrum-color.svg" alt="Arbitrum" className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm text-white">{getActionLabel()}</span>
              </div>
              <div className="text-xs text-white/60">{formatElapsedTime(timeElapsed)} ago</div>
            </div>

            {/* Horizontal Separator */}
            <div className="h-px bg-lightgreen-100/10 mb-2"></div>

            {/* Row 2: TWO COLUMNS - Left (stacked items) | Right (button) */}
            <div className="flex items-start justify-between gap-4">
              {/* LEFT COLUMN - Items stacked vertically */}
              <div className="flex flex-col gap-2">
                {/* Item 1: TX Hash */}
                <div className="text-xs text-white/60">
                  <span className="text-white/50">TX:</span>
                  <a
                    href={transaction.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 font-mono text-lightgreen-100 hover:text-lightgreen-200 underline"
                  >
                    {fmtHash(transaction.txHash)}
                  </a>
                </div>

                {/* Item 2: Value Badge */}
                <div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-lightgreen-100/20 text-white/90 font-mono">
                    {transaction.amount} {transaction.fromToken}
                  </span>
                </div>

                {/* Item 3: Compact Timeline with popup styling */}
                <div className="flex items-center gap-2">
                  {lastTwoStages.map((stage, index) => {
                    const isCompleted = stages.findIndex((s) => s.stage === stage.stage) < currentStageIndex
                    const isCurrent = stage.stage === transaction.stage
                    const isPending = !isCompleted && !isCurrent

                    return (
                      <React.Fragment key={stage.stage}>
                        <div className="flex items-center gap-1.5">
                          {/* Circle matching popup style */}
                          <div
                            className={clsx(
                              'w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300',
                              {
                                'bg-lightgreen-100': isCompleted,
                                'bg-lightgreen-100/20 border border-lightgreen-100': isCurrent,
                                'bg-black border border-white/30': isPending,
                              },
                            )}
                          >
                            {isCompleted ? (
                              <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : isCurrent ? (
                              <div className="w-2.5 h-2.5 bg-lightgreen-100 rounded-full animate-pulse" />
                            ) : (
                              <div className="w-2 h-2 bg-white/20 rounded-full" />
                            )}
                          </div>
                          <span
                            className={clsx('text-[11px] font-medium transition-colors', {
                              'text-lightgreen-100': isCompleted || isCurrent,
                              'text-white/50': isPending,
                            })}
                          >
                            {stage.label}
                          </span>
                        </div>
                        {/* Connecting line between stages */}
                        {index < lastTwoStages.length - 1 && <div className="h-0.5 w-8 bg-white/20" />}
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>

              {/* RIGHT COLUMN - Button centered with content */}
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="px-3 py-1.5 bg-lightgreen-100/10 hover:bg-lightgreen-100/20 border border-lightgreen-100/30 hover:border-lightgreen-100/50 rounded text-xs text-lightgreen-100 hover:text-lightgreen-200 transition-all duration-200 whitespace-nowrap self-center"
              >
                View details
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal transaction={transaction} isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}

export default TransactionStatusCard
