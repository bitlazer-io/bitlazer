import React, { FC, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { PendingTransaction, TRANSACTION_STAGES } from '../../../types/transactions'
import TransactionTimeline from '../TransactionTimeline/TransactionTimeline'
import { fmtHash } from '../../../utils/fmt'

interface TransactionStatusCardProps {
  transaction: PendingTransaction
  onClose?: () => void
  className?: string
}

const TransactionStatusCard: FC<TransactionStatusCardProps> = ({ transaction, onClose, className }) => {
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

  const formatElapsedTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'completed':
        return 'text-lightgreen-100 border-lightgreen-100'
      case 'failed':
        return 'text-red-400 border-red-400'
      default:
        return 'text-yellow-400 border-yellow-400'
    }
  }

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )
      case 'failed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        )
      default:
        return <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    }
  }

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
                onClick={() => setShowModal(true)}
                className="px-3 py-1.5 bg-lightgreen-100/10 hover:bg-lightgreen-100/20 border border-lightgreen-100/30 hover:border-lightgreen-100/50 rounded text-xs text-lightgreen-100 hover:text-lightgreen-200 transition-all duration-200 whitespace-nowrap self-center"
              >
                View details
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Popup - rendered as portal at document root */}
      {showModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed top-0 left-0 w-screen h-screen bg-black/80" onClick={() => setShowModal(false)} />
            <div className="relative bg-darkslategray-200 border-4 border-lightgreen-100 max-w-xl w-full shadow-[0_0_0_2px_rgba(102,213,96,0.4)]">
              {/* Header Bar with Close Button */}
              <div className="bg-darkslategray-200 px-3 py-1.5 flex items-center justify-between">
                <h2 className="text-lightgreen-100 text-base font-ocrx uppercase">Transaction Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-lightgreen-100 hover:bg-lightgreen-100 hover:text-black transition-colors w-6 h-6 flex items-center justify-center font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="p-5">
                {/* Transaction Info Card */}
                <div className="bg-black border-2 border-lightgreen-100 p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lightgreen-100 text-lg font-ocrx uppercase">{getActionLabel()}</span>
                    <div className="text-right">
                      <div className="text-lightgreen-100 text-lg font-ocrx">
                        {transaction.amount} {transaction.fromToken}
                      </div>
                      <div className="text-white text-sm font-mono mt-1">{formatElapsedTime(timeElapsed)} ago</div>
                    </div>
                  </div>
                </div>

                {/* Transaction Hash */}
                <div className="bg-black border-2 border-lightgreen-100 p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm uppercase font-maison-neue">Transaction Hash</span>
                    <a
                      href={transaction.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lightgreen-100 font-mono text-sm hover:text-lightgreen-200 underline"
                    >
                      {fmtHash(transaction.txHash, 16)}
                    </a>
                  </div>
                </div>

                {/* Networks */}
                <div className="bg-black border-2 border-lightgreen-100 p-3 mb-4">
                  <div className="flex items-center justify-between">
                    {/* From Network - Left */}
                    <div className="flex items-center gap-2">
                      {transaction.fromChain === 'Arbitrum One' ? (
                        <img src="/icons/crypto/arbitrum-color.svg" alt="Arbitrum" className="w-5 h-5" />
                      ) : (
                        <img src="/images/bitlazer-icon.svg" alt="Bitlazer" className="w-5 h-5" />
                      )}
                      <span className="text-lightgreen-100 text-sm font-mono">{transaction.fromChain}</span>
                    </div>

                    {/* Long Arrow - Center */}
                    <svg
                      className="w-12 h-4 text-white/60 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 48 16"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 8h40m-6-4l6 4-6 4" />
                    </svg>

                    {/* To Network - Right */}
                    <div className="flex items-center gap-2">
                      {transaction.toChain === 'Arbitrum One' ? (
                        <img src="/icons/crypto/arbitrum-color.svg" alt="Arbitrum" className="w-5 h-5" />
                      ) : (
                        <img src="/images/bitlazer-icon.svg" alt="Bitlazer" className="w-5 h-5" />
                      )}
                      <span className="text-lightgreen-100 text-sm font-mono">{transaction.toChain}</span>
                    </div>
                  </div>
                </div>

                {/* Full Timeline */}
                <div className="bg-black border-2 border-lightgreen-100 p-4">
                  <h3 className="text-lightgreen-100 font-ocrx mb-3 uppercase">Transaction Progress</h3>
                  <TransactionTimeline type={transaction.type} currentStage={transaction.stage} />
                </div>

                {/* Warning for bridge transactions */}
                {transaction.type.includes('bridge') && (
                  <div className="mt-4 bg-black border-2 border-lightgreen-100 p-3">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="text-white text-sm font-maison-neue">
                        {transaction.type === 'bridge-reverse'
                          ? 'Withdrawal may take up to 7 days to complete on Arbitrum network.'
                          : 'Bridge transfer may take up to 15 minutes to complete.'}
                        <br />
                        <a
                          href="https://bitlazer.bridge.caldera.xyz/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lightgreen-100 underline hover:text-lightgreen-200 mt-1 inline-block"
                        >
                          Track status on Caldera →
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

export default TransactionStatusCard
