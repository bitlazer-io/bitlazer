import { ArbiscanAPI } from '../UI/pages/explorer/services/arbiscanAPI'
import { BitlazerAPI } from '../UI/pages/explorer/services/bitlazerAPI'
import { Transaction, TransactionType, NetworkType } from '../UI/pages/explorer/types'
import { ERC20_CONTRACT_ADDRESS, L2_GATEWAY_ROUTER, L2_GATEWAY_ROUTER_BACK } from '../web3/contracts'
import { fetchWithCache, cache, CACHE_KEYS, CACHE_TTL } from '../utils/cache'
import { usePriceStore } from '../stores/priceStore'

interface UserTransaction extends Transaction {
  gasFeeUSD?: number
  totalFeeUSD?: number
  confirmations?: number
  nonce?: string
  position?: number
  methodName?: string
  stage?: string
}

class UserTransactionService {
  private arbiscanAPI: ArbiscanAPI
  private bitlazerAPI: BitlazerAPI

  constructor() {
    this.arbiscanAPI = new ArbiscanAPI()
    this.bitlazerAPI = new BitlazerAPI()
  }

  /**
   * Fetch the last bridge transaction for a user address
   * @param address User wallet address
   * @param network Network to fetch from (arbitrum or bitlazer)
   * @param direction Bridge direction filter
   */
  async fetchLastBridgeTransaction(
    address: string,
    network: NetworkType,
    direction?: 'to-bitlazer' | 'from-bitlazer',
  ): Promise<UserTransaction | null> {
    if (!address) return null

    const cacheKey = `${CACHE_KEYS.USER_LAST_TX}_${address.toLowerCase()}_${network}_bridge_${direction || 'any'}`

    try {
      // Check if we have cached data
      const cached = cache.get<UserTransaction>(cacheKey)
      if (cached) {
        return cached
      }

      // Fetch fresh data
      const transaction =
        network === NetworkType.ARBITRUM
          ? await this.fetchLastArbitrumBridgeTransaction(address, direction)
          : await this.fetchLastBitlazerBridgeTransaction(address, direction)

      // Determine cache TTL based on transaction age
      if (transaction) {
        let ttl = CACHE_TTL.USER_TX // Default 1 minute

        if (transaction.timestamp) {
          const ageInMs = Date.now() - transaction.timestamp * 1000
          const oneHourInMs = 60 * 60 * 1000

          if (ageInMs > oneHourInMs) {
            ttl = 10 * 60 * 1000 // 10 minutes for transactions older than 1 hour
          }
        }

        // Cache with appropriate TTL
        cache.set(cacheKey, transaction, ttl)
      }

      return transaction
    } catch (error) {
      console.error('Error fetching last bridge transaction:', error)
      return null
    }
  }

  /**
   * Fetch last bridge transaction from Arbitrum
   */
  private async fetchLastArbitrumBridgeTransaction(
    address: string,
    direction?: 'to-bitlazer' | 'from-bitlazer',
  ): Promise<UserTransaction | null> {
    try {
      // Fetch token transfers to find bridge transactions
      const transfers = await this.arbiscanAPI.fetchTokenTransfers({
        address,
        contractAddress: ERC20_CONTRACT_ADDRESS.lzrBTC,
        page: 1,
        offset: 50,
        sort: 'desc',
      })

      // Filter for bridge transactions (transfers to L2_GATEWAY_ROUTER)
      const bridgeTransactions = transfers.filter((tx) => {
        if (direction === 'to-bitlazer') {
          // Look for transfers TO the gateway (bridge to L3)
          return tx.to?.toLowerCase() === L2_GATEWAY_ROUTER.toLowerCase() && tx.type === TransactionType.BRIDGE
        }
        // For from-bitlazer, we won't find them on Arbitrum
        return false
      })

      if (bridgeTransactions.length === 0) {
        return null
      }

      // Get the most recent bridge transaction
      const lastTx = bridgeTransactions[0]

      // Fetch additional transaction details using Arbiscan API
      const txDetails = await this.fetchArbitrumTransactionDetails(lastTx.hash)

      // Calculate gas fees in USD
      const { ethPrice } = usePriceStore.getState()
      let gasFeeUSD = 0
      if (txDetails && txDetails.gasUsed && txDetails.effectiveGasPrice) {
        const gasUsedBN =
          typeof txDetails.gasUsed === 'string' ? parseInt(txDetails.gasUsed, 16) : Number(txDetails.gasUsed)
        const gasPriceBN =
          typeof txDetails.effectiveGasPrice === 'string'
            ? parseInt(txDetails.effectiveGasPrice, 16)
            : Number(txDetails.effectiveGasPrice)
        const gasFeeETH = (gasUsedBN * gasPriceBN) / 1e18
        gasFeeUSD = gasFeeETH * ethPrice
      }

      return {
        ...lastTx,
        gasFeeUSD: gasFeeUSD || 0,
        totalFeeUSD: gasFeeUSD || 0,
        confirmations: txDetails?.confirmations || 0,
        nonce: txDetails?.nonce,
        position: txDetails?.transactionIndex,
        methodName: 'depositERC20',
      }
    } catch (error) {
      console.error('Error fetching Arbitrum bridge transaction:', error)
      return null
    }
  }

  /**
   * Fetch last bridge transaction from Bitlazer
   */
  private async fetchLastBitlazerBridgeTransaction(
    address: string,
    direction?: 'to-bitlazer' | 'from-bitlazer',
  ): Promise<UserTransaction | null> {
    try {
      // For Bitlazer, we need to fetch bridge events
      const bridgeEvents = await this.bitlazerAPI.fetchBridgeEvents(0, 'latest')

      // Filter for user's transactions
      const userBridges = bridgeEvents.filter((tx) => {
        const isUserTx = tx.from?.toLowerCase() === address.toLowerCase()
        if (!isUserTx) return false

        if (direction === 'from-bitlazer') {
          // Withdrawals from Bitlazer to Arbitrum
          return tx.destinationNetwork === NetworkType.ARBITRUM
        }
        // For to-bitlazer, we won't find them on Bitlazer (they originate on Arbitrum)
        return false
      })

      if (userBridges.length === 0) {
        return null
      }

      // Get the most recent bridge transaction
      const lastTx = userBridges[0]

      // Fetch additional details if available
      const txDetails = await this.bitlazerAPI.fetchTransactionByHash(lastTx.hash)

      // Calculate gas fees in USD (Bitlazer uses ETH for gas)
      const { ethPrice } = usePriceStore.getState()
      let gasFeeUSD = 0

      if (txDetails && txDetails.gasUsed && txDetails.gasPrice) {
        // Parse gas values (they come as hex strings)
        const gasUsed =
          typeof txDetails.gasUsed === 'string' && txDetails.gasUsed.startsWith('0x')
            ? parseInt(txDetails.gasUsed, 16)
            : Number(txDetails.gasUsed)
        const gasPrice =
          typeof txDetails.gasPrice === 'string' && txDetails.gasPrice.startsWith('0x')
            ? parseInt(txDetails.gasPrice, 16)
            : Number(txDetails.gasPrice)

        const gasFeeETH = (gasUsed * gasPrice) / 1e18
        gasFeeUSD = gasFeeETH * ethPrice
      }

      // Get confirmations from the API response directly if available
      let confirmations = 1 // Default minimum

      if (txDetails && txDetails.confirmations) {
        // The API returns confirmations directly as a string
        confirmations = parseInt(txDetails.confirmations, 10)
      } else if (lastTx.timestamp) {
        // Fallback to time-based estimation if API doesn't provide confirmations
        const timeElapsed = Date.now() / 1000 - lastTx.timestamp
        confirmations = Math.max(1, Math.floor(timeElapsed / 2))
      }

      // Determine transaction stage for withdrawals
      let stage: string | undefined
      const isWithdrawal = txDetails && txDetails.to === L2_GATEWAY_ROUTER_BACK
      if (isWithdrawal) {
        stage = 'bridging' // Withdrawals stay in bridging during 7-day period
      }

      const result = {
        ...lastTx,
        gasFeeUSD,
        totalFeeUSD: gasFeeUSD,
        confirmations,
        nonce: txDetails?.hash,
        methodName: 'withdrawEth',
        stage, // Include stage in the cached result
      }

      return result
    } catch (error) {
      console.error('Error fetching Bitlazer bridge transaction:', error)
      return null
    }
  }

  /**
   * Fetch detailed transaction information from Arbiscan
   */
  private async fetchArbitrumTransactionDetails(txHash: string): Promise<any> {
    // Check cache first
    const cacheKey = `arbiscan_tx_details_${txHash.toLowerCase()}`
    const cached = cache.get<any>(cacheKey)
    if (cached) {
      // Update confirmations based on time elapsed
      if (cached.blockNumber && cached.timestamp) {
        const ageInSeconds = Date.now() / 1000 - cached.timestamp
        const additionalBlocks = Math.floor(ageInSeconds * 4) // ~0.25 second blocks
        cached.confirmations = (cached.confirmations || 0) + additionalBlocks
      }
      return cached
    }
    try {
      const apiKey = import.meta.env.VITE_ARBISCAN_API_KEY || ''
      const response = await fetch(
        `https://api.arbiscan.io/api?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${apiKey}`,
      )
      const data = await response.json()

      if (data.result) {
        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Also fetch transaction details for nonce and other info
        const txResponse = await fetch(
          `https://api.arbiscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${apiKey}`,
        )
        const txData = await txResponse.json()

        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Get current block number for confirmations
        const blockResponse = await fetch(
          `https://api.arbiscan.io/api?module=proxy&action=eth_blockNumber&apikey=${apiKey}`,
        )
        const blockData = await blockResponse.json()

        // Handle rate limiting or error responses
        let currentBlock = 0
        let confirmations = 0

        if (blockData.result && blockData.status !== '0') {
          currentBlock = parseInt(blockData.result, 16)
          const txBlock = data.result.blockNumber ? parseInt(data.result.blockNumber, 16) : 0
          confirmations = currentBlock > txBlock ? currentBlock - txBlock : 0
        } else {
          // If we can't get current block due to rate limiting, try to estimate
          // based on transaction age (Arbitrum has ~0.25 second block time)
          const txBlock = data.result.blockNumber ? parseInt(data.result.blockNumber, 16) : 0

          // Try to get timestamp from transaction to estimate age
          if (txData.result && txData.result.timestamp) {
            const txTimestamp = parseInt(txData.result.timestamp, 16)
            const currentTime = Math.floor(Date.now() / 1000)
            const ageInSeconds = currentTime - txTimestamp
            // Arbitrum produces ~4 blocks per second
            confirmations = Math.max(1, Math.floor(ageInSeconds * 4))
          } else {
            // Last resort: for very old transactions, estimate based on block number
            // Current Arbitrum block is likely > 370 million based on the transaction we saw
            const estimatedCurrentBlock = 370000000 // Conservative estimate
            confirmations = Math.max(1, estimatedCurrentBlock - txBlock)
          }
        }

        const result = {
          ...data.result,
          gasUsed: data.result.gasUsed,
          effectiveGasPrice: data.result.effectiveGasPrice || data.result.gasPrice || txData.result?.gasPrice,
          nonce: txData.result?.nonce,
          transactionIndex: data.result.transactionIndex ? parseInt(data.result.transactionIndex, 16) : 0,
          confirmations,
          timestamp: Date.now() / 1000,
        }

        // Cache the result - longer TTL for old transactions
        const ttl = confirmations > 100 ? 10 * 60 * 1000 : 60 * 1000
        cache.set(cacheKey, result, ttl)

        return result
      }
      return null
    } catch (error) {
      console.error('Error fetching transaction details from Arbiscan:', error)
      return null
    }
  }

  /**
   * Fetch user's recent transactions (all types)
   */
  async fetchUserTransactions(address: string, network: NetworkType, limit = 10): Promise<UserTransaction[]> {
    if (!address) return []

    const cacheKey = `${CACHE_KEYS.USER_TXS}_${address.toLowerCase()}_${network}_${limit}`

    try {
      return await fetchWithCache(
        cacheKey,
        async () => {
          if (network === NetworkType.ARBITRUM) {
            // Fetch both regular transactions and token transfers
            const [transactions, tokenTransfers] = await Promise.all([
              this.arbiscanAPI.fetchTransactions({
                address,
                page: 1,
                offset: limit,
                sort: 'desc',
              }),
              this.arbiscanAPI.fetchTokenTransfers({
                address,
                page: 1,
                offset: limit,
                sort: 'desc',
              }),
            ])

            // Combine and sort by timestamp
            const allTxs = [...transactions, ...tokenTransfers]
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, limit)

            // Add USD values for gas fees
            const { ethPrice } = usePriceStore.getState()
            return allTxs.map((tx) => ({
              ...tx,
              gasFeeUSD: tx.gasUsed && tx.gasPrice ? ((Number(tx.gasUsed) * Number(tx.gasPrice)) / 1e18) * ethPrice : 0,
            }))
          } else {
            // For Bitlazer, fetch all transaction types
            const allTxs = await this.bitlazerAPI.fetchAllTransactions(1000)

            // Filter for user's transactions
            const userTxs = allTxs
              .filter(
                (tx) =>
                  tx.from?.toLowerCase() === address.toLowerCase() || tx.to?.toLowerCase() === address.toLowerCase(),
              )
              .slice(0, limit)

            // Add USD values for gas fees
            const { ethPrice } = usePriceStore.getState()
            return userTxs.map((tx) => ({
              ...tx,
              gasFeeUSD: tx.gasUsed && tx.gasPrice ? ((Number(tx.gasUsed) * Number(tx.gasPrice)) / 1e18) * ethPrice : 0,
            }))
          }
        },
        { ttl: CACHE_TTL.USER_TX },
      )
    } catch (error) {
      console.error('Error fetching user transactions:', error)
      return []
    }
  }

  /**
   * Get transaction status and stage
   * This is only used for status checks, not for initial transaction fetching
   */
  async getTransactionStatus(
    txHash: string,
    network: NetworkType,
  ): Promise<{
    status: 'pending' | 'confirmed' | 'failed'
    confirmations: number
    stage?: string
  }> {
    const cacheKey = `tx_status_${txHash.toLowerCase()}_${network}`

    // Check cache first
    const cached = cache.get<{
      status: 'pending' | 'confirmed' | 'failed'
      confirmations: number
      stage?: string
      timestamp: number
    }>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      let result: {
        status: 'pending' | 'confirmed' | 'failed'
        confirmations: number
        stage?: string
        timestamp: number
      }

      if (network === NetworkType.ARBITRUM) {
        const details = await this.fetchArbitrumTransactionDetails(txHash)
        if (!details) {
          return { status: 'pending', confirmations: 0 }
        }

        result = {
          status: details.status ? 'confirmed' : 'failed',
          confirmations: details.confirmations || 0,
          stage: details.confirmations > 0 ? 'completed' : 'confirming',
          timestamp: Date.now(),
        }
      } else {
        // For Bitlazer, use the API to check transaction
        const tx = await this.bitlazerAPI.fetchTransactionByHash(txHash)
        if (!tx) {
          return { status: 'pending', confirmations: 0 }
        }

        // Get confirmations from API response if available
        let confirmations = 1 // Default to 1 for confirmed transactions

        if (tx.confirmations) {
          // API returns confirmations directly
          confirmations = parseInt(tx.confirmations, 10)
        } else if (tx.blockNumber && tx.timeStamp) {
          // Fallback: estimate based on timestamp
          const txTimestamp = parseInt(tx.timeStamp, 16)
          const currentTime = Math.floor(Date.now() / 1000)
          const timeDiff = currentTime - txTimestamp
          // Estimate blocks based on ~2 second block time
          confirmations = Math.max(1, Math.floor(timeDiff / 2))
        }

        // For Bitlazer transactions, we need to check if it's a withdrawal
        // Withdrawals to Arbitrum take 7 days and should not be marked as completed
        // even if confirmed on Bitlazer
        const isWithdrawal = tx.to === L2_GATEWAY_ROUTER_BACK // ArbSys contract

        result = {
          status: tx.isError === '1' ? 'failed' : ('confirmed' as 'pending' | 'confirmed' | 'failed'),
          confirmations,
          stage: isWithdrawal ? 'bridging' : 'completed', // Withdrawals stay in bridging
          timestamp: Date.now(),
        }
      }

      // Cache the result with appropriate TTL based on transaction age
      // For old transactions (>1 hour), use 10 minute cache
      const transactionAge = Date.now() - (result.timestamp || Date.now())
      const oneHourInMs = 60 * 60 * 1000
      const ttl = transactionAge > oneHourInMs ? 10 * 60 * 1000 : CACHE_TTL.USER_TX

      cache.set(cacheKey, result, ttl)

      return result
    } catch (error) {
      console.error('Error getting transaction status:', error)
      return { status: 'pending', confirmations: 0 }
    }
  }
}

// Export singleton instance
export const userTransactionService = new UserTransactionService()

// Export types
export type { UserTransaction }
