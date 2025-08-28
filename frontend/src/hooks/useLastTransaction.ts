import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { createPublicClient, http, parseAbiItem, parseEventLogs } from 'viem'
import { arbitrum } from 'wagmi/chains'
import { mainnet } from '../web3/chains'
import { ERC20_CONTRACT_ADDRESS, L2_GATEWAY_ROUTER } from '../web3/contracts'
import { PendingTransaction, TransactionType, TransactionStage } from '../types/transactions'
import { fetchWithCache, CACHE_KEYS, CACHE_TTL } from '../utils/cache'

const arbitrumClient = createPublicClient({
  chain: arbitrum,
  transport: http(),
})

const bitlazerClient = createPublicClient({
  chain: mainnet,
  transport: http(),
})

const STORAGE_KEY = 'bitlazer_pending_transactions'
const MAX_TRANSACTION_AGE = 24 * 60 * 60 * 1000 // 24 hours
const ARBITRUM_BLOCKS_TO_SEARCH = 3000000n
const BITLAZER_BLOCKS_TO_SEARCH = 3000000n

export const useLastTransaction = () => {
  const { address } = useAccount()
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([])
  const [historicalTransaction, setHistoricalTransaction] = useState<PendingTransaction | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load pending transactions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const transactions: PendingTransaction[] = JSON.parse(stored)
        const validTransactions = transactions.filter((tx) => Date.now() - tx.timestamp < MAX_TRANSACTION_AGE)
        setPendingTransactions(validTransactions)

        if (validTransactions.length !== transactions.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(validTransactions))
        }
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

  // Update transaction stage
  const updateTransactionStage = useCallback(
    (txHash: string, stage: TransactionStage) => {
      const updated = pendingTransactions.map((tx) =>
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
            }
          : tx,
      )
      savePendingTransactions(updated)
    },
    [pendingTransactions, savePendingTransactions],
  )

  // Remove a pending transaction
  const removePendingTransaction = useCallback(
    (txHash: string) => {
      const updated = pendingTransactions.filter((tx) => tx.txHash !== txHash)
      savePendingTransactions(updated)
    },
    [pendingTransactions, savePendingTransactions],
  )

  // Check transaction status on chain
  const checkTransactionStatus = useCallback(async (txHash: string, chainId: number) => {
    try {
      const client = chainId === arbitrum.id ? arbitrumClient : bitlazerClient

      try {
        const receipt = await client.getTransactionReceipt({
          hash: txHash as `0x${string}`,
        })

        if (receipt) {
          const currentBlock = await client.getBlockNumber()
          const confirmations = Math.max(0, Number(currentBlock - receipt.blockNumber))

          return {
            status: receipt.status === 'success' ? 'success' : 'failure',
            confirmations,
            blockNumber: Number(receipt.blockNumber),
          }
        }
      } catch (receiptError) {
        console.warn('Transaction receipt not found, checking if pending:', receiptError)

        try {
          const transaction = await client.getTransaction({
            hash: txHash as `0x${string}`,
          })

          if (transaction) {
            return {
              status: 'pending',
              confirmations: 0,
            }
          }
        } catch (txError) {
          console.warn('Transaction not found:', txError)
        }
      }

      return null
    } catch (error) {
      console.error('Transaction status check failed:', error)
      return null
    }
  }, [])

  // Determine transaction stage based on status and time
  const determineTransactionStage = useCallback((transaction: PendingTransaction, receipt: any): TransactionStage => {
    const timeElapsed = (Date.now() - transaction.timestamp) / (1000 * 60) // minutes

    if (!receipt) {
      if (timeElapsed < 2) return 'initiating'
      if (timeElapsed < 5) return 'submitted'
      return 'confirming'
    }

    if (receipt.status === 'failure') {
      return 'failed'
    }

    if (receipt.status === 'success') {
      if (transaction.type === 'bridge' || transaction.type === 'bridge-reverse') {
        if (transaction.type === 'bridge-reverse') {
          if (timeElapsed < 1) return 'confirming'
          if (timeElapsed < 5) return 'bridging'
          if (timeElapsed > 10080) return 'completed'
          return 'finalizing'
        } else {
          if (receipt.confirmations >= 1) {
            if (timeElapsed > 15) {
              return 'completed'
            }
            return 'bridging'
          } else {
            return 'confirming'
          }
        }
      } else {
        return receipt.confirmations >= 3 ? 'completed' : 'confirming'
      }
    }

    return 'submitted'
  }, [])

  // Fetch historical transactions from blockchain with caching
  const fetchHistoricalTransaction = useCallback(
    async (force = false) => {
      if (!address) {
        setHistoricalTransaction(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        // Create cache key unique to the user's address
        const cacheKey = `${CACHE_KEYS.BRIDGE_TRANSACTIONS}_${address.toLowerCase()}`

        const transaction = await fetchWithCache(
          cacheKey,
          async () => {
            const arbCurrentBlock = await arbitrumClient.getBlockNumber()
            const l3CurrentBlock = await bitlazerClient.getBlockNumber()

            const arbFromBlock =
              arbCurrentBlock > ARBITRUM_BLOCKS_TO_SEARCH ? arbCurrentBlock - ARBITRUM_BLOCKS_TO_SEARCH : 0n
            const l3FromBlock =
              l3CurrentBlock > BITLAZER_BLOCKS_TO_SEARCH ? l3CurrentBlock - BITLAZER_BLOCKS_TO_SEARCH : 0n

            const allTransactions: PendingTransaction[] = []

            // 1. FETCH BRIDGE TO L3 (transfers FROM user TO gateway on Arbitrum)
            const bridgeToL3Logs = await arbitrumClient.getLogs({
              address: ERC20_CONTRACT_ADDRESS.lzrBTC as `0x${string}`,
              event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
              args: {
                from: address as `0x${string}`,
                to: L2_GATEWAY_ROUTER as `0x${string}`,
              },
              fromBlock: arbFromBlock,
              toBlock: arbCurrentBlock,
            })

            for (const log of bridgeToL3Logs) {
              if (log.args && 'value' in log.args) {
                const block = await arbitrumClient.getBlock({ blockHash: log.blockHash! })
                allTransactions.push({
                  id: `${log.transactionHash}_historical`,
                  type: 'bridge',
                  status: 'completed',
                  stage: 'completed',
                  fromChain: 'Arbitrum One',
                  toChain: 'Bitlazer L3',
                  fromToken: 'lzrBTC',
                  toToken: 'lzrBTC',
                  amount: (Number(log.args.value) / 1e18).toFixed(8),
                  timestamp: Number(block.timestamp) * 1000,
                  estimatedTime: 0,
                  txHash: log.transactionHash!,
                  fromChainId: arbitrum.id,
                  toChainId: mainnet.id,
                  explorerUrl: `https://arbiscan.io/tx/${log.transactionHash}`,
                })
              }
            }

            // 2. FETCH BRIDGE FROM L3 - Look for WithdrawalInitiated events from the bridge contract
            // We know the event signature from the logs: 0x3e7aafa77dbf186b7fd488006beff893744caa3c4f6f299e8a709fa2087374fc
            let bridgeFromL3Logs: any[] = []

            try {
              // Fetch logs with the WithdrawalInitiated signature we found
              const allBridgeLogs = await bitlazerClient.getLogs({
                address: '0x0000000000000000000000000000000000000064' as `0x${string}`,
                fromBlock: 0n, // Start from 0 since chain is very new (only 131 blocks)
                toBlock: l3CurrentBlock,
              })

              // Filter for WithdrawalInitiated events (signature: 0x3e7aafa77dbf186b7fd488006beff893744caa3c4f6f299e8a709fa2087374fc)
              // and events that have our address in the topics
              const withdrawalInitiatedSignature = '0x3e7aafa77dbf186b7fd488006beff893744caa3c4f6f299e8a709fa2087374fc'
              const addressTopic = address ? `0x${address.slice(2).padStart(64, '0').toLowerCase()}` : ''

              bridgeFromL3Logs = allBridgeLogs.filter((log) => {
                // Check if it's a WithdrawalInitiated event
                if (log.topics[0] !== withdrawalInitiatedSignature) return false

                // Check if our address is in the topics (usually topic[1] is the from address)
                return log.topics.some((topic) => topic.toLowerCase() === addressTopic.toLowerCase())
              })
            } catch (error) {
              console.error('Failed to fetch bridge logs:', error)
            }

            for (const log of bridgeFromL3Logs) {
              try {
                const block = await bitlazerClient.getBlock({ blockHash: log.blockHash! })

                // Get transaction details to extract amount
                const tx = await bitlazerClient.getTransaction({ hash: log.transactionHash as `0x${string}` })

                // Use the transaction value as the amount (native lzrBTC on L3)
                const amount = tx ? (Number(tx.value) / 1e18).toFixed(8) : '0.00000000'

                allTransactions.push({
                  id: `${log.transactionHash}_historical`,
                  type: 'bridge-reverse',
                  status: 'pending',
                  stage: 'finalizing',
                  fromChain: 'Bitlazer L3',
                  toChain: 'Arbitrum One',
                  fromToken: 'lzrBTC',
                  toToken: 'lzrBTC',
                  amount: amount,
                  timestamp: Number(block.timestamp) * 1000,
                  estimatedTime: 0,
                  txHash: log.transactionHash!,
                  fromChainId: mainnet.id,
                  toChainId: arbitrum.id,
                  explorerUrl: `https://bitlazer.calderaexplorer.xyz/tx/${log.transactionHash}`,
                })
              } catch (error) {
                console.error('Error processing bridge log:', error)
              }
            }

            // Find the most recent transaction
            const mostRecent = allTransactions.sort((a, b) => b.timestamp - a.timestamp)[0] || null
            return mostRecent
          },
          {
            ttl: CACHE_TTL.STATS, // Cache for 2 minutes
            force,
          },
        )

        setHistoricalTransaction(transaction)
      } catch (error) {
        console.error('Error fetching historical transactions:', error)
        setHistoricalTransaction(null)
      } finally {
        setIsLoading(false)
      }
    },
    [address],
  )

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

  // Get the latest transaction overall (pending or historical)
  const getLatestTransaction = useCallback(() => {
    // Get the most recent pending transaction
    const latestPending = pendingTransactions.sort((a, b) => b.timestamp - a.timestamp)[0]

    // If there's a pending transaction, return it
    if (latestPending) {
      return latestPending
    }

    // Otherwise return the historical transaction
    return historicalTransaction
  }, [pendingTransactions, historicalTransaction])

  // Get the latest bridge transaction only (for Bridge page)
  const getLatestBridgeTransaction = useCallback(() => {
    // Filter for bridge transactions only
    const bridgePending = pendingTransactions
      .filter((tx) => tx.type === 'bridge' || tx.type === 'bridge-reverse')
      .sort((a, b) => b.timestamp - a.timestamp)[0]

    // If there's a pending bridge transaction, return it
    if (bridgePending) {
      return bridgePending
    }

    // Otherwise return the historical transaction (which is already filtered for bridges)
    return historicalTransaction
  }, [pendingTransactions, historicalTransaction])

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
