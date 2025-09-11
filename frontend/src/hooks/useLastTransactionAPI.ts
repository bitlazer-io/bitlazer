import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { arbitrum } from 'wagmi/chains'
import { mainnet, SUPPORTED_CHAINS } from '../web3/chains'
import { PendingTransaction, TransactionType, TransactionStage } from '../types/transactions'
import { userTransactionService, UserTransaction } from '../services/userTransactionService'
import { NetworkType, TransactionType as ExplorerTransactionType } from '../UI/pages/explorer/types'
import { usePriceStore } from '../stores/priceStore'

const STORAGE_KEY = 'bitlazer_pending_transactions'

export const useLastTransactionAPI = (bridgeDirection?: 'arbitrum-to-bitlazer' | 'bitlazer-to-arbitrum') => {
  const { address } = useAccount()
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([])
  const [historicalTransaction, setHistoricalTransaction] = useState<PendingTransaction | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { btcPrice } = usePriceStore()

  // Load pending transactions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const transactions: PendingTransaction[] = JSON.parse(stored)
        setPendingTransactions(transactions)
      } catch (error) {
        console.error('Failed to parse pending transactions:', error)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  // Save pending transactions to localStorage
  const savePendingTransactions = useCallback((transactions: PendingTransaction[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
    setPendingTransactions(transactions)
  }, [])

  // Add a new pending transaction
  const addPendingTransaction = useCallback(
    (transaction: Omit<PendingTransaction, 'id' | 'timestamp'>) => {
      const newTransaction: PendingTransaction = {
        ...transaction,
        id: `${transaction.txHash}_${Date.now()}`,
        timestamp: Date.now(),
      }

      const updated = [...pendingTransactions, newTransaction]
      savePendingTransactions(updated)
    },
    [pendingTransactions, savePendingTransactions],
  )

  // Update transaction stage with enhanced details
  const updateTransactionStage = useCallback(
    (txHash: string, stage: TransactionStage, enhancedDetails?: any) => {
      const updatedPending = pendingTransactions.map((tx) =>
        tx.txHash === txHash
          ? {
              ...tx,
              stage,
              status:
                stage === 'completed'
                  ? ('completed' as const)
                  : stage === 'failed'
                    ? ('failed' as const)
                    : ('pending' as const),
              ...(enhancedDetails && {
                blockNumber: enhancedDetails.blockNumber,
                blockTimestamp: enhancedDetails.blockTimestamp,
                gasUsed: enhancedDetails.gasUsed,
                gasLimit: enhancedDetails.gasLimit,
                gasFeeUSD: enhancedDetails.gasFeeUSD,
                totalFeeUSD: enhancedDetails.totalFeeUSD,
                confirmations: enhancedDetails.confirmations,
                nonce: enhancedDetails.nonce,
                methodName: enhancedDetails.methodName,
              }),
            }
          : tx,
      )

      const foundInPending = updatedPending.some((tx) => tx.txHash === txHash)

      // Also update historical transaction if it matches
      if (!foundInPending && historicalTransaction?.txHash === txHash && enhancedDetails) {
        const updatedHistorical = {
          ...historicalTransaction,
          stage,
          status:
            stage === 'completed'
              ? ('completed' as const)
              : stage === 'failed'
                ? ('failed' as const)
                : ('pending' as const),
          ...enhancedDetails,
        }
        setHistoricalTransaction(updatedHistorical)
      }

      savePendingTransactions(updatedPending)
    },
    [pendingTransactions, historicalTransaction, savePendingTransactions],
  )

  // Remove a pending transaction
  const removePendingTransaction = useCallback(
    (txHash: string) => {
      const updated = pendingTransactions.filter((tx) => tx.txHash !== txHash)
      savePendingTransactions(updated)
    },
    [pendingTransactions, savePendingTransactions],
  )

  // Check transaction status using Explorer API
  const checkTransactionStatus = useCallback(
    async (txHash: string, chainId: number) => {
      try {
        const network = chainId === arbitrum.id ? NetworkType.ARBITRUM : NetworkType.BITLAZER

        // Get basic status
        const status = await userTransactionService.getTransactionStatus(txHash, network)

        // Try to get full transaction details for enhanced info
        let enhancedDetails: any = {}
        try {
          const userTxs = await userTransactionService.fetchUserTransactions(address || '', network, 1)
          const thisTx = userTxs.find((tx) => tx.hash === txHash)
          if (thisTx) {
            enhancedDetails = {
              blockNumber: thisTx.blockNumber,
              blockTimestamp: thisTx.timestamp,
              gasUsed: thisTx.gasUsed ? Number(thisTx.gasUsed) : undefined,
              gasLimit: thisTx.gasPrice ? Number(thisTx.gasPrice) : undefined,
              gasFeeUSD: thisTx.gasFeeUSD,
              confirmations: thisTx.confirmations,
            }
          }
        } catch (error) {
          console.warn('Could not fetch enhanced transaction details:', error)
        }

        return {
          status: status.status === 'confirmed' ? 'success' : status.status === 'failed' ? 'failure' : 'pending',
          confirmations: status.confirmations,
          stage: status.stage,
          ...enhancedDetails,
        }
      } catch (error) {
        console.error('Transaction status check failed:', error)
        return null
      }
    },
    [address],
  )

  // Determine transaction stage based on status and receipt
  const determineTransactionStage = useCallback((transaction: PendingTransaction, receipt: any): TransactionStage => {
    if (!receipt) {
      return transaction.stage || 'confirming'
    }

    if (receipt.status === 'failure') {
      return 'failed'
    }

    // For withdrawals (bridge-reverse), NEVER mark as completed unless we have explicit confirmation
    // The 7-day period is enforced by the rollup, not by us
    if (transaction.type === 'bridge-reverse') {
      // If the transaction is already marked as completed from API, respect that
      if (transaction.status === 'completed') {
        return 'completed'
      }

      // Otherwise, withdrawals stay in bridging/finalizing until actually completed on L1
      if (receipt.confirmations && receipt.confirmations > 0) {
        // Even with confirmations on L3, withdrawal is still pending on L1
        return 'bridging' // Stay in bridging for the entire 7-day period
      }
      return 'confirming'
    }

    // For deposits (bridge) - Arbitrum to Bitlazer
    if (transaction.type === 'bridge') {
      if (receipt.status === 'success') {
        if (receipt.confirmations >= 100) {
          return 'completed'
        } else if (receipt.confirmations > 0) {
          return 'finalizing'
        }
        return 'bridging'
      }
    }

    // For other transaction types
    if (receipt.status === 'success' && receipt.confirmations >= 5) {
      return 'completed'
    }

    return transaction.stage || 'confirming'
  }, [])

  // Clear historical transaction immediately when direction changes
  useEffect(() => {
    if (bridgeDirection) {
      setHistoricalTransaction(null)
      setIsLoading(true)
    }
  }, [bridgeDirection])

  // Fetch historical transaction from Explorer API
  const fetchHistoricalTransaction = useCallback(async () => {
    if (!address) {
      setHistoricalTransaction(null)
      setIsLoading(false)
      return
    }

    // Don't set loading here since we already set it in the useEffect above
    // This prevents the brief flash when switching

    try {
      let lastTx: UserTransaction | null = null

      // Determine which network to fetch from based on bridge direction
      if (bridgeDirection === 'arbitrum-to-bitlazer') {
        // Fetch from Arbitrum for bridges to Bitlazer
        lastTx = await userTransactionService.fetchLastBridgeTransaction(address, NetworkType.ARBITRUM, 'to-bitlazer')
      } else if (bridgeDirection === 'bitlazer-to-arbitrum') {
        // Fetch from Bitlazer for bridges to Arbitrum
        lastTx = await userTransactionService.fetchLastBridgeTransaction(address, NetworkType.BITLAZER, 'from-bitlazer')
      } else {
        // Fetch from both networks and get the most recent
        const [arbTx, bitTx] = await Promise.all([
          userTransactionService.fetchLastBridgeTransaction(address, NetworkType.ARBITRUM),
          userTransactionService.fetchLastBridgeTransaction(address, NetworkType.BITLAZER),
        ])

        // Get the most recent transaction
        if (arbTx && bitTx) {
          lastTx = arbTx.timestamp > bitTx.timestamp ? arbTx : bitTx
        } else {
          lastTx = arbTx || bitTx
        }
      }

      if (lastTx) {
        // Use the actual status from the API
        // The API should tell us if the transaction is confirmed, pending, or failed
        const isConfirmed = lastTx.status === 'confirmed'
        const isFailed = lastTx.status === 'failed'

        // For bridge transactions, we need to check if it's actually completed on the destination chain
        const isWithdrawal =
          lastTx.type === ExplorerTransactionType.BRIDGE && lastTx.sourceNetwork === NetworkType.BITLAZER

        let status: 'pending' | 'completed' | 'failed' = 'pending'
        let stage: TransactionStage = 'confirming'

        if (isFailed) {
          status = 'failed'
          stage = 'failed'
        } else if (isWithdrawal) {
          // Use the stage from the service if it already determined it
          if (lastTx.stage) {
            stage = lastTx.stage as TransactionStage
            status = stage === 'completed' ? 'completed' : stage === 'failed' ? 'failed' : 'pending'
          } else {
            // Fallback: For withdrawals, they stay in bridging state
            if (isConfirmed) {
              status = 'pending'
              stage = 'bridging' // Stay in bridging state for the 7-day period
            } else {
              status = 'pending'
              stage = 'confirming'
            }
          }
        } else {
          // For deposits (Arbitrum to Bitlazer)
          if (isConfirmed) {
            // Check confirmations to determine if it's fully settled
            if (lastTx.confirmations && lastTx.confirmations >= 100) {
              status = 'completed'
              stage = 'completed'
            } else if (lastTx.confirmations && lastTx.confirmations > 0) {
              status = 'pending'
              stage = 'finalizing'
            } else {
              status = 'pending'
              stage = 'bridging'
            }
          } else {
            status = 'pending'
            stage = 'confirming'
          }
        }

        // Convert to PendingTransaction format with enhanced details
        const pendingTx: PendingTransaction = {
          id: `${lastTx.hash}_historical`,
          type:
            lastTx.type === ExplorerTransactionType.BRIDGE
              ? lastTx.sourceNetwork === NetworkType.ARBITRUM
                ? 'bridge'
                : 'bridge-reverse'
              : 'transfer',
          status,
          stage,
          fromChain:
            lastTx.sourceNetwork === NetworkType.ARBITRUM
              ? SUPPORTED_CHAINS.arbitrumOne.name
              : SUPPORTED_CHAINS.bitlazerL3.name,
          toChain:
            lastTx.destinationNetwork === NetworkType.BITLAZER
              ? SUPPORTED_CHAINS.bitlazerL3.name
              : lastTx.destinationNetwork === NetworkType.ARBITRUM
                ? SUPPORTED_CHAINS.arbitrumOne.name
                : '',
          fromToken: lastTx.asset,
          toToken: lastTx.asset,
          amount: lastTx.amount,
          timestamp: lastTx.timestamp * 1000, // Convert to milliseconds
          estimatedTime: 0,
          txHash: lastTx.hash,
          fromChainId: lastTx.sourceNetwork === NetworkType.ARBITRUM ? arbitrum.id : mainnet.id,
          toChainId:
            lastTx.destinationNetwork === NetworkType.BITLAZER
              ? mainnet.id
              : lastTx.destinationNetwork === NetworkType.ARBITRUM
                ? arbitrum.id
                : 0,
          explorerUrl: lastTx.explorerUrl,
          // Enhanced details
          blockNumber: lastTx.blockNumber,
          gasFeeUSD: lastTx.gasFeeUSD,
          totalFeeUSD: lastTx.totalFeeUSD,
          confirmations: lastTx.confirmations,
          nonce: lastTx.nonce,
          methodName: lastTx.methodName,
          // Add USD value of transaction
          amountUSD: btcPrice ? parseFloat(lastTx.amount) * btcPrice : undefined,
        }

        setHistoricalTransaction(pendingTx)
      } else {
        setHistoricalTransaction(null)
      }
    } catch (error) {
      console.error('Error fetching historical transaction:', error)
      setHistoricalTransaction(null)
    } finally {
      setIsLoading(false)
    }
  }, [address, bridgeDirection, btcPrice])

  // Fetch historical transactions on mount and address change
  useEffect(() => {
    fetchHistoricalTransaction()
  }, [fetchHistoricalTransaction])

  // Get the latest transaction by type
  const getLatestTransactionByType = useCallback(
    (type: TransactionType) => {
      return pendingTransactions.filter((tx) => tx.type === type).sort((a, b) => b.timestamp - a.timestamp)[0] || null
    },
    [pendingTransactions],
  )

  // Get the latest transaction overall
  const getLatestTransaction = useCallback(() => {
    const latestPending = pendingTransactions.sort((a, b) => b.timestamp - a.timestamp)[0]
    if (latestPending) {
      return latestPending
    }
    return historicalTransaction
  }, [pendingTransactions, historicalTransaction])

  // Get the latest bridge transaction only
  const getLatestBridgeTransaction = useCallback(() => {
    const bridgePending = pendingTransactions
      .filter((tx) => tx.type === 'bridge' || tx.type === 'bridge-reverse')
      .sort((a, b) => b.timestamp - a.timestamp)[0]

    if (bridgePending) {
      return bridgePending
    }
    // Only return historical if not loading and it matches the current direction
    if (!isLoading && historicalTransaction) {
      // Check if the historical transaction matches the current direction
      if (bridgeDirection === 'arbitrum-to-bitlazer' && historicalTransaction.type === 'bridge') {
        return historicalTransaction
      } else if (bridgeDirection === 'bitlazer-to-arbitrum' && historicalTransaction.type === 'bridge-reverse') {
        return historicalTransaction
      }
    }
    return null
  }, [pendingTransactions, historicalTransaction, isLoading, bridgeDirection])

  return {
    // Transaction management
    addPendingTransaction,
    updateTransactionStage,
    removePendingTransaction,

    // Transaction queries
    getLatestTransactionByType,
    getLatestTransaction,
    getLatestBridgeTransaction,

    // Transaction status checking
    checkTransactionStatus,
    determineTransactionStage,

    // Loading state
    isLoading,

    // Refetch historical data
    refetchHistorical: fetchHistoricalTransaction,
  }
}
