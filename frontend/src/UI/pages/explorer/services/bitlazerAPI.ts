import { EXPLORER_CONFIG } from 'src/config/explorer'
import { Transaction, TransactionType, TransactionStatus, NetworkType } from '../types'
import { STAKING_CONTRACTS } from 'src/web3/contracts'

// Event signatures
const EVENT_SIGNATURES = {
  Transfer: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  // Correct Staked event signature from T3RNStakingAdapter
  Staked: '0x9e71bc8eea02a63969f509818f2dafb9254532904319f9dbda79b67bd34a5f3d',
  // Correct Unstaked event signature from T3RNStakingAdapter
  Unstaked: '0x204fccf0d92ed8d48f204adb39b2e81e92bad0dedb93f5716ca9478cfb57de00',
  WithdrawalInitiated: '0x3e7aafa77dbf186b7fd488006beff893744caa3c4f6f299e8a709fa2087374fc',
}

interface BitlazerLog {
  address: string
  blockNumber: string
  data: string
  gasPrice: string
  gasUsed: string
  logIndex: string
  timeStamp: string
  topics: string[]
  transactionHash: string
  transactionIndex: string
}

interface BitlazerTransaction {
  blockNumber: string
  timeStamp: string
  hash: string
  from: string
  to: string
  value: string
  gas: string
  gasPrice: string
  gasUsed: string
  input: string
  isError?: string
  logs?: Array<{
    address: string
    topics: string[]
    data: string
  }>
}

export class BitlazerAPI {
  private apiUrl: string
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.apiUrl = EXPLORER_CONFIG.bitlazer.apiUrl
    // Extract base URL (remove /api part for RPC calls)
    this.baseUrl = this.apiUrl.replace('/api', '')
    this.apiKey = EXPLORER_CONFIG.bitlazer.apiKey
  }

  private buildUrl(params: Record<string, any>): string {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    if (this.apiKey) {
      searchParams.append('apikey', this.apiKey)
    }
    return `${this.apiUrl}?${searchParams.toString()}`
  }

  private async fetchWithRetry(url: string, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url)
        const data = await response.json()

        // Don't throw error for "No logs found" - it's a valid response
        if (
          data.status === '0' &&
          data.message !== 'No transactions found' &&
          data.message !== 'No logs found' &&
          data.message !== 'OK'
        ) {
          throw new Error(data.message || 'API request failed')
        }

        return data
      } catch (error) {
        if (i === retries - 1) throw error
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }

  // Removed checkForStakingEvents - no longer needed with optimized approach

  /**
   * Fetch all Transfer events (mints, burns only - not regular transfers)
   */
  async fetchTransferEvents(fromBlock = 0, toBlock: number | 'latest' = 'latest'): Promise<Transaction[]> {
    const url = this.buildUrl({
      module: 'logs',
      action: 'getLogs',
      fromBlock,
      toBlock,
      topic0: EVENT_SIGNATURES.Transfer,
      // Only get transfers from lzrBTC contract
      address: '0x0c978B2F8F3A0E399DaF5C41e4776757253EE5Df',
    })

    const response = await this.fetchWithRetry(url)
    const logs = response.result || []

    const transactions: Transaction[] = []
    const processedHashes = new Set<string>()

    for (const log of logs) {
      if (processedHashes.has(log.transactionHash)) continue
      processedHashes.add(log.transactionHash)

      // Parse without fetching additional details first
      const transaction = await this.parseTransferLogOptimized(log)
      // Only include wrap/unwrap transactions, not regular transfers
      if (transaction && transaction.type !== TransactionType.TRANSFER) {
        transactions.push(transaction)
      }
    }

    return transactions
  }

  /**
   * Fetch staking events
   */
  async fetchStakingEvents(fromBlock = 0, toBlock: number | 'latest' = 'latest'): Promise<Transaction[]> {
    const transactions: Transaction[] = []

    try {
      // Fetch both Staked and Unstaked events in parallel
      const [stakedResponse, unstakedResponse] = await Promise.all([
        this.fetchWithRetry(
          this.buildUrl({
            module: 'logs',
            action: 'getLogs',
            fromBlock,
            toBlock,
            topic0: EVENT_SIGNATURES.Staked,
            address: STAKING_CONTRACTS.T3RNStakingAdapter.toLowerCase(),
          }),
        ),
        this.fetchWithRetry(
          this.buildUrl({
            module: 'logs',
            action: 'getLogs',
            fromBlock,
            toBlock,
            topic0: EVENT_SIGNATURES.Unstaked,
            address: STAKING_CONTRACTS.T3RNStakingAdapter.toLowerCase(),
          }),
        ),
      ])

      const stakedLogs = stakedResponse.result || []
      const unstakedLogs = unstakedResponse.result || []

      // Create a map of tx hashes that have Staked events
      const stakedTxHashes = new Set(stakedLogs.map((log: any) => log.transactionHash))
      const processedHashes = new Set<string>()

      // Process Staked events (STAKE transactions)
      for (const log of stakedLogs) {
        if (processedHashes.has(log.transactionHash)) continue
        processedHashes.add(log.transactionHash)

        const tx = await this.parseStakingTransactionOptimized(
          log.transactionHash,
          TransactionType.STAKE,
          log,
          parseInt(log.timeStamp, 16),
          parseInt(log.blockNumber, 16),
        )
        if (tx) transactions.push(tx)
      }

      // Process Unstaked events (only pure UNSTAKE, not part of STAKE)
      for (const log of unstakedLogs) {
        if (processedHashes.has(log.transactionHash)) continue
        if (stakedTxHashes.has(log.transactionHash)) continue // Skip if part of STAKE tx
        processedHashes.add(log.transactionHash)

        const tx = await this.parseStakingTransactionOptimized(
          log.transactionHash,
          TransactionType.UNSTAKE,
          log,
          parseInt(log.timeStamp, 16),
          parseInt(log.blockNumber, 16),
        )
        if (tx) transactions.push(tx)
      }
    } catch (error) {
      console.error('Error fetching staking events:', error)
    }

    return transactions
  }

  /**
   * Fetch bridge withdrawal events
   */
  async fetchBridgeEvents(fromBlock = 0, toBlock: number | 'latest' = 'latest'): Promise<Transaction[]> {
    const url = this.buildUrl({
      module: 'logs',
      action: 'getLogs',
      fromBlock,
      toBlock,
      topic0: EVENT_SIGNATURES.WithdrawalInitiated,
      address: '0x0000000000000000000000000000000000000064',
    })

    try {
      const response = await this.fetchWithRetry(url)
      const logs = response.result || []

      const transactions: Transaction[] = []
      for (const log of logs) {
        const tx = await this.parseBridgeLogOptimized(log)
        if (tx) transactions.push(tx)
      }

      return transactions
    } catch (error) {
      console.error('Error fetching bridge events:', error)
      return []
    }
  }

  /**
   * Fetch transaction details by hash
   */
  async fetchTransactionByHash(hash: string): Promise<BitlazerTransaction | null> {
    const url = this.buildUrl({
      module: 'transaction',
      action: 'gettxinfo',
      txhash: hash,
    })

    try {
      const response = await this.fetchWithRetry(url)
      return response.result
    } catch (error) {
      console.error('Error fetching transaction by hash:', error)
      return null
    }
  }

  // Keeping parseTransferLog for backward compatibility but not using it
  private async parseTransferLog(log: BitlazerLog): Promise<Transaction | null> {
    return this.parseTransferLogOptimized(log)
  }

  private async parseTransferLogOptimized(log: BitlazerLog): Promise<Transaction | null> {
    try {
      let from = '0x' + log.topics[1]?.slice(26) || '0x0'
      const to = '0x' + log.topics[2]?.slice(26) || '0x0'

      // Parse amount from data (uint256)
      const amount = BigInt(log.data || '0x0')
      const amountInEther = Number(amount) / 1e18

      // Determine transaction type based on from/to addresses
      let type = TransactionType.TRANSFER

      // Check if it's a mint (wrap) or burn (unwrap) based on 0x0 address
      if (from === '0x0000000000000000000000000000000000000000') {
        type = TransactionType.WRAP // Mint operation
        // For wrap transactions, we need to fetch the actual initiator
        const txDetails = await this.fetchTransactionByHash(log.transactionHash)
        if (txDetails && txDetails.from) {
          from = txDetails.from
        } else {
          from = to // Fallback to recipient if fetch fails
        }
      } else if (to === '0x0000000000000000000000000000000000000000') {
        type = TransactionType.UNWRAP // Burn operation
        // For unwrap, from is already correct (the person burning)
      } else {
        // Regular transfer - we don't want to show these
        return null
      }

      return {
        id: log.transactionHash,
        hash: log.transactionHash,
        type,
        status: TransactionStatus.CONFIRMED,
        from,
        to,
        amount: amountInEther.toString(),
        asset: 'lzrBTC',
        sourceNetwork: NetworkType.BITLAZER,
        timestamp: parseInt(log.timeStamp, 16),
        blockNumber: parseInt(log.blockNumber, 16),
        explorerUrl: `https://bitlazer.calderaexplorer.xyz/tx/${log.transactionHash}`,
        gasUsed: log.gasUsed,
        gasPrice: log.gasPrice,
      }
    } catch (error) {
      console.error('Error parsing transfer log optimized:', error)
      return null
    }
  }

  private async parseStakingTransaction(
    txHash: string,
    type: TransactionType,
    amountLog: any,
    txDetails: any,
  ): Promise<Transaction | null> {
    try {
      // User address is in topic[1] of the amount log
      const user = '0x' + amountLog.topics[1]?.slice(26) || '0x0'
      const realFromAddress = txDetails?.from || user

      let amount: bigint

      if (type === TransactionType.STAKE) {
        // For STAKE: use Staked event data (single value = new stake amount)
        amount = BigInt(amountLog.data || '0x0')
      } else {
        // For UNSTAKE: use Unstaked event data (3 values, we want the middle one)
        // data format: principal (64 chars) + unstaked amount (64 chars) + rewards (64 chars)
        const dataHex = amountLog.data || '0x0'
        const cleanData = dataHex.slice(2)
        const unstakedAmountHex = '0x' + cleanData.slice(64, 128)
        amount = BigInt(unstakedAmountHex)
      }

      const amountInEther = Number(amount) / 1e18

      return {
        id: txHash,
        hash: txHash,
        type,
        status: TransactionStatus.CONFIRMED,
        from: realFromAddress,
        to: STAKING_CONTRACTS.T3RNStakingAdapter,
        amount: amountInEther.toString(),
        asset: 'lzrBTC',
        sourceNetwork: NetworkType.BITLAZER,
        timestamp: parseInt(txDetails.timeStamp, 10),
        blockNumber: parseInt(txDetails.blockNumber, 10),
        explorerUrl: `https://bitlazer.calderaexplorer.xyz/tx/${txHash}`,
        gasUsed: txDetails?.gasUsed,
        gasPrice: txDetails?.gasPrice,
      }
    } catch (error) {
      console.error('Error parsing staking transaction:', error)
      return null
    }
  }

  // Keeping parseBridgeLog for backward compatibility
  private async parseBridgeLog(log: BitlazerLog): Promise<Transaction | null> {
    return this.parseBridgeLogOptimized(log)
  }

  private async parseBridgeLogOptimized(log: BitlazerLog): Promise<Transaction | null> {
    try {
      // For bridge transactions, we need to fetch tx details to get the actual amount
      // This is necessary because the WithdrawalInitiated event doesn't contain the amount
      const txDetails = await this.fetchTransactionByHash(log.transactionHash)
      if (!txDetails) return null

      return {
        id: log.transactionHash,
        hash: log.transactionHash,
        type: TransactionType.BRIDGE,
        status: TransactionStatus.PENDING,
        from: txDetails.from,
        to: '0x0000000000000000000000000000000000000064',
        amount: (Number(txDetails.value) / 1e18).toString(),
        asset: 'lzrBTC',
        sourceNetwork: NetworkType.BITLAZER,
        destinationNetwork: NetworkType.ARBITRUM,
        timestamp: parseInt(log.timeStamp, 16),
        blockNumber: parseInt(log.blockNumber, 16),
        explorerUrl: `https://bitlazer.calderaexplorer.xyz/tx/${log.transactionHash}`,
        gasUsed: txDetails.gasUsed,
        gasPrice: txDetails.gasPrice,
      }
    } catch (error) {
      console.error('Error parsing bridge log optimized:', error)
      return null
    }
  }

  private async parseStakingTransactionOptimized(
    txHash: string,
    type: TransactionType,
    log: any,
    timestamp: number,
    blockNumber: number,
  ): Promise<Transaction | null> {
    try {
      // User address is in topic[1] of the log
      const user = '0x' + log.topics[1]?.slice(26) || '0x0'

      let amount: bigint

      if (type === TransactionType.STAKE) {
        // For STAKE: use Staked event data (single value = new stake amount)
        amount = BigInt(log.data || '0x0')
      } else {
        // For UNSTAKE: use Unstaked event data (3 values, we want the middle one)
        // data format: principal (64 chars) + unstaked amount (64 chars) + rewards (64 chars)
        const dataHex = log.data || '0x0'
        const cleanData = dataHex.slice(2)
        const unstakedAmountHex = '0x' + cleanData.slice(64, 128)
        amount = BigInt(unstakedAmountHex)
      }

      const amountInEther = Number(amount) / 1e18

      return {
        id: txHash,
        hash: txHash,
        type,
        status: TransactionStatus.CONFIRMED,
        from: user, // Use user address from log instead of fetching tx details
        to: STAKING_CONTRACTS.T3RNStakingAdapter,
        amount: amountInEther.toString(),
        asset: 'lzrBTC',
        sourceNetwork: NetworkType.BITLAZER,
        timestamp,
        blockNumber,
        explorerUrl: `https://bitlazer.calderaexplorer.xyz/tx/${txHash}`,
        gasUsed: log.gasUsed,
        gasPrice: log.gasPrice,
      }
    } catch (error) {
      console.error('Error parsing staking transaction optimized:', error)
      return null
    }
  }

  /**
   * Fetch all transactions from Bitlazer using event logs (lightweight - no individual API calls)
   */
  async fetchAllTransactionsLightweight(maxBlocks = 100): Promise<Transaction[]> {
    try {
      // Get current block using RPC endpoint
      const rpcResponse = await fetch(`${this.baseUrl}/api/eth-rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
      })
      const rpcData = await rpcResponse.json()
      const currentBlock = parseInt(rpcData.result, 16)

      // Handle case where chain is new or has few blocks
      let fromBlock: number
      if (!currentBlock || currentBlock < 1000) {
        fromBlock = 0
        console.log(`Bitlazer chain has low block number: ${currentBlock}, fetching all blocks from genesis`)
      } else {
        fromBlock = Math.max(0, currentBlock - maxBlocks)
      }

      console.log(`Fetching Bitlazer transactions (lightweight) from block ${fromBlock} to ${currentBlock || 'latest'}`)

      // Fetch all event types in parallel but use lightweight parsing
      const [transfers, stakingEvents, bridgeEvents] = await Promise.all([
        this.fetchTransferEventsLightweight(fromBlock, currentBlock || 'latest'),
        this.fetchStakingEvents(fromBlock, currentBlock || 'latest'), // This one is already optimized
        this.fetchBridgeEventsLightweight(fromBlock, currentBlock || 'latest'),
      ])

      // Combine and deduplicate
      const allTransactions = [...transfers, ...stakingEvents, ...bridgeEvents]
      const uniqueTransactions = Array.from(new Map(allTransactions.map((tx) => [tx.hash, tx])).values())

      // Sort by timestamp (newest first)
      return uniqueTransactions.sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      console.error('Error fetching Bitlazer transactions (lightweight):', error)
      return []
    }
  }

  /**
   * Fetch all transactions from Bitlazer using event logs
   */
  async fetchAllTransactions(maxBlocks = 10000): Promise<Transaction[]> {
    try {
      // Get current block using RPC endpoint
      const rpcResponse = await fetch(`${this.baseUrl}/api/eth-rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
      })
      const rpcData = await rpcResponse.json()
      const currentBlock = parseInt(rpcData.result, 16)

      // Handle case where chain is new or has few blocks
      let fromBlock: number
      if (!currentBlock || currentBlock < 1000) {
        // If chain has less than 1000 blocks, fetch all
        fromBlock = 0
        console.log(`Bitlazer chain has low block number: ${currentBlock}, fetching all blocks from genesis`)
      } else {
        fromBlock = Math.max(0, currentBlock - maxBlocks)
      }

      console.log(`Fetching Bitlazer transactions from block ${fromBlock} to ${currentBlock || 'latest'}`)

      // Fetch all event types in parallel
      const [transfers, stakingEvents, bridgeEvents] = await Promise.all([
        this.fetchTransferEvents(fromBlock, currentBlock || 'latest'),
        this.fetchStakingEvents(fromBlock, currentBlock || 'latest'),
        this.fetchBridgeEvents(fromBlock, currentBlock || 'latest'),
      ])

      // Combine and deduplicate
      const allTransactions = [...transfers, ...stakingEvents, ...bridgeEvents]
      const uniqueTransactions = Array.from(new Map(allTransactions.map((tx) => [tx.hash, tx])).values())

      // Sort by timestamp (newest first)
      return uniqueTransactions.sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      console.error('Error fetching Bitlazer transactions:', error)
      return []
    }
  }

  /**
   * Fetch transfer events (lightweight - no individual API calls for wrap transactions)
   */
  async fetchTransferEventsLightweight(fromBlock = 0, toBlock: number | 'latest' = 'latest'): Promise<Transaction[]> {
    const url = this.buildUrl({
      module: 'logs',
      action: 'getLogs',
      fromBlock,
      toBlock,
      topic0: EVENT_SIGNATURES.Transfer,
      address: '0x0c978B2F8F3A0E399DaF5C41e4776757253EE5Df',
    })

    const response = await this.fetchWithRetry(url)
    const logs = response.result || []

    const transactions: Transaction[] = []
    const processedHashes = new Set<string>()

    for (const log of logs) {
      if (processedHashes.has(log.transactionHash)) continue
      processedHashes.add(log.transactionHash)

      const transaction = await this.parseTransferLogLightweight(log)
      if (transaction && transaction.type !== TransactionType.TRANSFER) {
        transactions.push(transaction)
      }
    }

    return transactions
  }

  /**
   * Fetch bridge events (lightweight - no individual API calls)
   */
  async fetchBridgeEventsLightweight(fromBlock = 0, toBlock: number | 'latest' = 'latest'): Promise<Transaction[]> {
    const url = this.buildUrl({
      module: 'logs',
      action: 'getLogs',
      fromBlock,
      toBlock,
      topic0: EVENT_SIGNATURES.WithdrawalInitiated,
      address: '0x0000000000000000000000000000000000000064',
    })

    try {
      const response = await this.fetchWithRetry(url)
      const logs = response.result || []

      const transactions: Transaction[] = []
      for (const log of logs) {
        const tx = await this.parseBridgeLogLightweight(log)
        if (tx) transactions.push(tx)
      }

      return transactions
    } catch (error) {
      console.error('Error fetching bridge events (lightweight):', error)
      return []
    }
  }

  /**
   * Parse transfer log without making individual API calls (for auto-refresh)
   */
  private async parseTransferLogLightweight(log: BitlazerLog): Promise<Transaction | null> {
    try {
      let from = '0x' + log.topics[1]?.slice(26) || '0x0'
      const to = '0x' + log.topics[2]?.slice(26) || '0x0'

      // Parse amount from data (uint256)
      const amount = BigInt(log.data || '0x0')
      const amountInEther = Number(amount) / 1e18

      let type = TransactionType.TRANSFER

      // Check if it's a mint (wrap) or burn (unwrap)
      if (from === '0x0000000000000000000000000000000000000000') {
        type = TransactionType.WRAP
        // Don't fetch tx details - use recipient as from address
        from = to
      } else if (to === '0x0000000000000000000000000000000000000000') {
        type = TransactionType.UNWRAP
      } else {
        return null // Skip regular transfers
      }

      return {
        id: log.transactionHash,
        hash: log.transactionHash,
        type,
        status: TransactionStatus.CONFIRMED,
        from,
        to,
        amount: amountInEther.toString(),
        asset: 'lzrBTC',
        sourceNetwork: NetworkType.BITLAZER,
        timestamp: parseInt(log.timeStamp, 16),
        blockNumber: parseInt(log.blockNumber, 16),
        explorerUrl: `https://bitlazer.calderaexplorer.xyz/tx/${log.transactionHash}`,
        gasUsed: log.gasUsed,
        gasPrice: log.gasPrice,
      }
    } catch (error) {
      console.error('Error parsing transfer log (lightweight):', error)
      return null
    }
  }

  /**
   * Parse bridge log without making individual API calls (for auto-refresh)
   */
  private async parseBridgeLogLightweight(log: BitlazerLog): Promise<Transaction | null> {
    try {
      // Don't fetch tx details - use placeholder amount
      return {
        id: log.transactionHash,
        hash: log.transactionHash,
        type: TransactionType.BRIDGE,
        status: TransactionStatus.PENDING,
        from: '0x' + log.topics[1]?.slice(26) || '0x0', // Extract from topics
        to: '0x0000000000000000000000000000000000000064',
        amount: '0.00000001', // Placeholder - will be updated on full page refresh
        asset: 'lzrBTC',
        sourceNetwork: NetworkType.BITLAZER,
        destinationNetwork: NetworkType.ARBITRUM,
        timestamp: parseInt(log.timeStamp, 16),
        blockNumber: parseInt(log.blockNumber, 16),
        explorerUrl: `https://bitlazer.calderaexplorer.xyz/tx/${log.transactionHash}`,
        gasUsed: log.gasUsed,
        gasPrice: log.gasPrice,
      }
    } catch (error) {
      console.error('Error parsing bridge log (lightweight):', error)
      return null
    }
  }
}
