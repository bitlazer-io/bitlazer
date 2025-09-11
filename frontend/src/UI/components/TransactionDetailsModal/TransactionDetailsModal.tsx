import React, { FC, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { PendingTransaction } from '../../../types/transactions'
import TransactionTimeline from '../TransactionTimeline/TransactionTimeline'
import { fmtHash } from '../../../utils/fmt'
import { formatElapsedTime } from '../../../utils/time'
import { formatTokenAmount } from '../../../utils/formatters'
import { SUPPORTED_CHAINS, getChainByName } from 'src/web3/chains'
import { Skeleton } from '../skeleton/Skeleton'

interface TransactionDetailsModalProps {
  transaction: PendingTransaction
  isOpen: boolean
  onClose: () => void
}

const TransactionDetailsModal: FC<TransactionDetailsModalProps> = ({ transaction, isOpen, onClose }) => {
  const [timeElapsed, setTimeElapsed] = useState(0)

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Update time elapsed every minute
  useEffect(() => {
    if (!isOpen) return

    const updateTimeElapsed = () => {
      const elapsed = Math.floor((Date.now() - transaction.timestamp) / (1000 * 60))
      setTimeElapsed(elapsed)
    }

    updateTimeElapsed()
    const interval = setInterval(updateTimeElapsed, 60000)

    return () => clearInterval(interval)
  }, [isOpen, transaction.timestamp])

  if (!isOpen) return null

  const getActionLabel = () => {
    const chain = getChainByName(transaction.toChain)
    const chainIcon = chain?.icon || SUPPORTED_CHAINS.bitlazerL3.icon

    switch (transaction.type) {
      case 'bridge':
        return (
          <div className="flex items-center gap-2">
            <img src={chainIcon} alt={transaction.toChain} className="w-5 h-5" />
            <span>Bridging to {transaction.toChain}</span>
          </div>
        )
      case 'bridge-reverse':
        return (
          <div className="flex items-center gap-2">
            <img src={chainIcon} alt={transaction.toChain} className="w-5 h-5" />
            <span>Withdrawing to {transaction.toChain}</span>
          </div>
        )
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />
      <div className="relative max-w-xl w-full my-8 max-h-[90vh] flex flex-col">
        <div className="w-full flex flex-col gap-[0.031rem]">
          {/* Header - exact copy from CONNECTED WALLET modal */}
          <div className="self-stretch rounded-[.115rem] bg-forestgreen flex flex-col py-[0.187rem] px-[0.125rem]">
            <div className="self-stretch shadow-[-1.8px_-0.9px_3.69px_rgba(215,_215,_215,_0.18)_inset,_1.8px_1.8px_1.84px_rgba(0,_0,_0,_0.91)_inset] rounded-[.115rem] bg-darkolivegreen-200 flex flex-row items-center justify-between py-2 px-4 gap-4">
              <div className="text-lightgreen-100 font-ocrx uppercase text-[1.25rem] md:text-[1.5rem]">
                Transaction Details
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 text-lightgreen-100 hover:text-lightgreen-100 shadow-[1.8px_1.8px_1.84px_rgba(0,_0,_0,_0.91)_inset] rounded-[.115rem] bg-darkolivegreen-200 flex items-center justify-center font-ocrx text-xl transition-all duration-300 hover:shadow-[1.8px_1.8px_1.84px_1.4px_rgba(0,_0,_0,_0.91)_inset]"
              >
                X
              </button>
            </div>
          </div>

          {/* Body content */}
          <div className="self-stretch -mt-[.1875rem] flex flex-col text-[1rem] text-white">
            <div className="bg-darkslategray-200 border-4 border-lightgreen-100 p-5 overflow-y-auto flex-1 max-h-[80vh]">
              {/* Transaction Info Card */}
              <div className="bg-black border-2 border-lightgreen-100 p-3 mb-4">
                <div className="flex justify-between items-center">
                  <div className="text-lightgreen-100 text-lg font-ocrx uppercase">{getActionLabel()}</div>
                  <div className="text-right">
                    <div className="text-lightgreen-100 text-lg font-ocrx">
                      {formatTokenAmount(transaction.amount, transaction.fromToken)}
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
                    {(() => {
                      const chain = getChainByName(transaction.fromChain)
                      const metadata = chain || SUPPORTED_CHAINS.bitlazerL3
                      return (
                        <>
                          <img src={metadata.icon} alt={metadata.name} className="w-5 h-5" />
                          <span className="text-lightgreen-100 text-sm font-mono">{transaction.fromChain}</span>
                        </>
                      )
                    })()}
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
                    {(() => {
                      const chain = getChainByName(transaction.toChain)
                      const metadata = chain || SUPPORTED_CHAINS.bitlazerL3
                      return (
                        <>
                          <img src={metadata.icon} alt={metadata.name} className="w-5 h-5" />
                          <span className="text-lightgreen-100 text-sm font-mono">{transaction.toChain}</span>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Full Timeline */}
              <div className="bg-black border-2 border-lightgreen-100 p-4 mb-4">
                <h3 className="text-lightgreen-100 font-ocrx mb-3 uppercase">Transaction Progress</h3>
                <TransactionTimeline type={transaction.type} currentStage={transaction.stage} />
              </div>

              {/* Transaction Details Section */}
              {(transaction.blockNumber || transaction.gasUsed || transaction.gasFeeUSD) && (
                <div className="bg-black border-2 border-lightgreen-100 p-3 mb-4">
                  <div className="space-y-2">
                    {transaction.blockNumber !== undefined ? (
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-maison-neue">Block Number</span>
                        {transaction.blockNumber === null ? (
                          <Skeleton className="h-4 w-24" />
                        ) : (
                          <span className="text-lightgreen-100 text-sm font-mono">#{transaction.blockNumber}</span>
                        )}
                      </div>
                    ) : null}
                    {transaction.confirmations !== undefined && (
                      <>
                        <div className="h-px bg-lightgreen-100/20"></div>
                        <div className="flex items-center justify-between">
                          <span className="text-white text-sm font-maison-neue">Confirmations</span>
                          {transaction.confirmations === null ? (
                            <Skeleton className="h-4 w-16" />
                          ) : (
                            <span className="text-lightgreen-100 text-sm font-mono">{transaction.confirmations}</span>
                          )}
                        </div>
                      </>
                    )}
                    {transaction.blockTimestamp && (
                      <>
                        <div className="h-px bg-lightgreen-100/20"></div>
                        <div className="flex items-center justify-between">
                          <span className="text-white text-sm font-maison-neue">Block Timestamp</span>
                          <span className="text-lightgreen-100 text-sm font-mono">
                            {new Date(transaction.blockTimestamp * 1000).toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                    {transaction.gasUsed && (
                      <>
                        <div className="h-px bg-lightgreen-100/20"></div>
                        <div className="flex items-center justify-between">
                          <span className="text-white text-sm font-maison-neue">Gas Used</span>
                          <span className="text-lightgreen-100 text-sm font-mono">
                            {(transaction.gasUsed || 0).toLocaleString()} /{' '}
                            {(transaction.gasLimit || 0).toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                    {transaction.gasFeeUSD !== undefined && (
                      <>
                        <div className="h-px bg-lightgreen-100/20"></div>
                        <div className="flex items-center justify-between">
                          <span className="text-white text-sm font-maison-neue">Gas Fee (USD)</span>
                          {transaction.gasFeeUSD === null ? (
                            <Skeleton className="h-4 w-16" />
                          ) : (
                            <span className="text-lightgreen-100 text-sm font-mono">
                              ${transaction.gasFeeUSD.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                    {transaction.amountUSD !== undefined && (
                      <>
                        <div className="h-px bg-lightgreen-100/20"></div>
                        <div className="flex items-center justify-between">
                          <span className="text-white text-sm font-maison-neue">Value (USD)</span>
                          {transaction.amountUSD === null ? (
                            <Skeleton className="h-4 w-16" />
                          ) : (
                            <span className="text-lightgreen-100 text-sm font-mono">
                              ${transaction.amountUSD.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                    {transaction.methodName && (
                      <>
                        <div className="h-px bg-lightgreen-100/20"></div>
                        <div className="flex items-center justify-between">
                          <span className="text-white text-sm font-maison-neue">Method</span>
                          {!transaction.methodName ? (
                            <Skeleton className="h-4 w-24" />
                          ) : (
                            <span className="text-lightgreen-100 text-sm font-mono">{transaction.methodName}</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Warning for bridge transactions - only show for withdrawals or incomplete deposits */}
              {transaction.type === 'bridge-reverse' && (
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
                      {`Withdrawal may take up to 7 days to complete on ${SUPPORTED_CHAINS.arbitrumOne.name} network.`}
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
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default TransactionDetailsModal
