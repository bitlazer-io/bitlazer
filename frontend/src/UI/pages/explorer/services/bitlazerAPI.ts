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

        if (data.status === '0' && data.message !== 'No transactions found' && data.message !== 'OK') {
          throw new Error(data.message || 'API request failed')
        }

        return data
      } catch (error) {
        if (i === retries - 1) throw error
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }

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

      const transaction = await this.parseTransferLog(log)
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

    // Fetch Staked events
    try {
      const stakedUrl = this.buildUrl({
        module: 'logs',
        action: 'getLogs',
        fromBlock,
        toBlock,
        topic0: EVENT_SIGNATURES.Staked,
        address: STAKING_CONTRACTS.T3RNStakingAdapter.toLowerCase(),
      })

      const stakedResponse = await this.fetchWithRetry(stakedUrl)
      const stakedLogs = stakedResponse.result || []

      for (const log of stakedLogs) {
        const tx = await this.parseStakingLog(log, TransactionType.STAKE)
        if (tx) transactions.push(tx)
      }
    } catch (error) {
      console.error('Error fetching staked events:', error)
    }

    // Fetch Unstaked events
    try {
      const unstakedUrl = this.buildUrl({
        module: 'logs',
        action: 'getLogs',
        fromBlock,
        toBlock,
        topic0: EVENT_SIGNATURES.Unstaked,
        address: STAKING_CONTRACTS.T3RNStakingAdapter.toLowerCase(),
      })

      const unstakedResponse = await this.fetchWithRetry(unstakedUrl)
      const unstakedLogs = unstakedResponse.result || []

      for (const log of unstakedLogs) {
        const tx = await this.parseStakingLog(log, TransactionType.UNSTAKE)
        if (tx) transactions.push(tx)
      }
    } catch (error) {
      console.error('Error fetching unstaked events:', error)
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
        const tx = await this.parseBridgeLog(log)
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

  private async parseTransferLog(log: BitlazerLog): Promise<Transaction | null> {
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
        // For mint transactions, fetch the actual transaction details to get the initiator
        const txDetails = await this.fetchTransactionByHash(log.transactionHash)
        if (txDetails && txDetails.from) {
          from = txDetails.from // Use the actual transaction initiator
        }
      } else if (to === '0x0000000000000000000000000000000000000000') {
        type = TransactionType.UNWRAP // Burn operation
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
      console.error('Error parsing transfer log:', error)
      return null
    }
  }

  private async parseStakingLog(log: BitlazerLog, type: TransactionType): Promise<Transaction | null> {
    try {
      // For staking events, user address is in topic[1]
      const user = '0x' + log.topics[1]?.slice(26) || '0x0'

      let amount: bigint

      if (type === TransactionType.STAKE) {
        // Staked event: amount is the single value in data
        amount = BigInt(log.data || '0x0')
      } else {
        // Unstaked event: data contains 3 values, we want the middle one (unstaked amount)
        // data format: principal (96 bytes) + unstaked amount (64 bytes) + rewards (64 bytes)
        const dataHex = log.data || '0x0'
        // Remove 0x prefix and extract the middle 64 characters (32 bytes)
        const cleanData = dataHex.slice(2)
        const unstakedAmountHex = '0x' + cleanData.slice(64, 128)
        amount = BigInt(unstakedAmountHex)
      }

      const amountInEther = Number(amount) / 1e18

      return {
        id: log.transactionHash,
        hash: log.transactionHash,
        type,
        status: TransactionStatus.CONFIRMED,
        from: type === TransactionType.STAKE ? user : STAKING_CONTRACTS.T3RNStakingAdapter,
        to: type === TransactionType.STAKE ? STAKING_CONTRACTS.T3RNStakingAdapter : user,
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
      console.error('Error parsing staking log:', error)
      return null
    }
  }

  private async parseBridgeLog(log: BitlazerLog): Promise<Transaction | null> {
    try {
      // Get transaction details to find sender
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
      console.error('Error parsing bridge log:', error)
      return null
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
      const currentBlock = parseInt(rpcData.result, 16) || 1000
      const fromBlock = Math.max(0, currentBlock - maxBlocks)

      console.log(`Fetching Bitlazer transactions from block ${fromBlock} to ${currentBlock}`)

      // Fetch all event types in parallel
      const [transfers, stakingEvents, bridgeEvents] = await Promise.all([
        this.fetchTransferEvents(fromBlock, currentBlock),
        this.fetchStakingEvents(fromBlock, currentBlock),
        this.fetchBridgeEvents(fromBlock, currentBlock),
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
}
