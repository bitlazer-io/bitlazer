import { BaseExplorerAPI } from './explorerAPI'
import { EXPLORER_CONFIG } from 'src/config/explorer'
import { Transaction, TransactionType, TransactionStatus, NetworkType } from '../types'
import { ERC20_CONTRACT_ADDRESS, L2_GATEWAY_ROUTER } from 'src/web3/contracts'

interface ArbiscanTransaction {
  blockNumber: string
  timeStamp: string
  hash: string
  nonce: string
  blockHash: string
  transactionIndex: string
  from: string
  to: string
  value: string
  gas: string
  gasPrice: string
  isError: string
  txreceipt_status: string
  input: string
  contractAddress: string
  cumulativeGasUsed: string
  gasUsed: string
  confirmations: string
  methodId: string
  functionName: string
}

interface ArbiscanTokenTransfer {
  blockNumber: string
  timeStamp: string
  hash: string
  nonce: string
  blockHash: string
  from: string
  contractAddress: string
  to: string
  value: string
  tokenName: string
  tokenSymbol: string
  tokenDecimal: string
  transactionIndex: string
  gas: string
  gasPrice: string
  gasUsed: string
  cumulativeGasUsed: string
  input: string
  confirmations: string
}

export class ArbiscanAPI extends BaseExplorerAPI {
  constructor() {
    super({
      apiUrl: EXPLORER_CONFIG.arbiscan.apiUrl,
      apiKey: EXPLORER_CONFIG.arbiscan.apiKey,
      requestsPerSecond: EXPLORER_CONFIG.arbiscan.rateLimit.requestsPerSecond,
      maxRetries: EXPLORER_CONFIG.arbiscan.rateLimit.maxRetries,
      retryDelay: EXPLORER_CONFIG.arbiscan.rateLimit.retryDelay,
    })
  }

  async fetchTransactions(params: {
    address?: string
    startBlock?: number
    endBlock?: number
    page?: number
    offset?: number
    sort?: 'asc' | 'desc'
  }): Promise<Transaction[]> {
    const url = this.buildUrl({
      module: 'account',
      action: 'txlist',
      address: params.address,
      startblock: params.startBlock || 0,
      endblock: params.endBlock || 99999999,
      page: params.page || 1,
      offset: params.offset || 100,
      sort: params.sort || 'desc',
    })

    const response = await this.fetchWithRetry(url)
    const transactions = response.result || []

    return transactions.map((tx: ArbiscanTransaction) => this.mapTransaction(tx))
  }

  async fetchTokenTransfers(params: {
    address?: string
    contractAddress?: string
    startBlock?: number
    endBlock?: number
    page?: number
    offset?: number
    sort?: 'asc' | 'desc'
  }): Promise<Transaction[]> {
    const url = this.buildUrl({
      module: 'account',
      action: 'tokentx',
      address: params.address,
      contractaddress: params.contractAddress || ERC20_CONTRACT_ADDRESS.lzrBTC,
      startblock: params.startBlock || 0,
      endblock: params.endBlock || 99999999,
      page: params.page || 1,
      offset: params.offset || 100,
      sort: params.sort || 'desc',
    })

    const response = await this.fetchWithRetry(url)
    const transfers = response.result || []

    // Process transfers and filter out regular transfers
    const mappedTransfers = transfers
      .filter((transfer: ArbiscanTokenTransfer) => {
        // Only process lzrBTC transfers
        if (transfer.contractAddress?.toLowerCase() !== ERC20_CONTRACT_ADDRESS.lzrBTC.toLowerCase()) {
          return false
        }

        // Keep only wrap, unwrap, and bridge transactions
        return (
          transfer.from === '0x0000000000000000000000000000000000000000' || // Wrap (mint)
          transfer.to === '0x0000000000000000000000000000000000000000' || // Unwrap (burn)
          transfer.to?.toLowerCase() === L2_GATEWAY_ROUTER.toLowerCase() // Bridge
        )
      })
      .map((transfer: ArbiscanTokenTransfer) => this.mapTokenTransfer(transfer))

    return mappedTransfers
  }

  async fetchInternalTransactions(params: {
    address?: string
    txhash?: string
    startBlock?: number
    endBlock?: number
    page?: number
    offset?: number
    sort?: 'asc' | 'desc'
  }): Promise<Transaction[]> {
    const action = params.txhash ? 'txlistinternal' : 'txlistinternal'
    const url = this.buildUrl({
      module: 'account',
      action,
      address: params.address,
      txhash: params.txhash,
      startblock: params.startBlock || 0,
      endblock: params.endBlock || 99999999,
      page: params.page || 1,
      offset: params.offset || 100,
      sort: params.sort || 'desc',
    })

    const response = await this.fetchWithRetry(url)
    const transactions = response.result || []

    return transactions.map((tx: ArbiscanTransaction) => this.mapTransaction(tx, true))
  }

  async fetchLogs(params: {
    address?: string
    fromBlock?: number
    toBlock?: number
    topic0?: string
    topic1?: string
    topic2?: string
    topic3?: string
    page?: number
    offset?: number
  }): Promise<any[]> {
    const url = this.buildUrl({
      module: 'logs',
      action: 'getLogs',
      address: params.address,
      fromBlock: params.fromBlock || 0,
      toBlock: params.toBlock || 'latest',
      topic0: params.topic0,
      topic1: params.topic1,
      topic2: params.topic2,
      topic3: params.topic3,
      page: params.page || 1,
      offset: params.offset || 100,
    })

    const response = await this.fetchWithRetry(url)
    return response.result || []
  }

  private mapTransaction(tx: ArbiscanTransaction, isInternal = false): Transaction {
    const type = this.determineTransactionType(tx)
    const status = tx.isError === '1' ? TransactionStatus.FAILED : TransactionStatus.CONFIRMED

    return {
      id: tx.hash,
      hash: tx.hash,
      type,
      status,
      from: tx.from,
      to: tx.to,
      amount: (Number(tx.value) / 1e18).toString(),
      asset: 'lzrBTC',
      sourceNetwork: NetworkType.ARBITRUM,
      destinationNetwork: type === TransactionType.BRIDGE ? NetworkType.BITLAZER : undefined,
      timestamp: Number(tx.timeStamp),
      blockNumber: Number(tx.blockNumber),
      explorerUrl: `https://arbiscan.io/tx/${tx.hash}`,
      gasUsed: tx.gasUsed,
      gasPrice: tx.gasPrice,
      isInternal,
    }
  }

  private mapTokenTransfer(transfer: ArbiscanTokenTransfer): Transaction {
    const type = this.determineTokenTransferType(transfer)
    const status = TransactionStatus.CONFIRMED

    // For wrap transactions (mints from 0x0), the 'to' address is the actual user
    // For unwrap transactions (burns to 0x0), the 'from' address is the actual user
    let from = transfer.from
    let to = transfer.to

    if (type === TransactionType.WRAP) {
      // Wrap: minted to user, so transfer.to is the user address
      from = transfer.to // User who wrapped
      to = ERC20_CONTRACT_ADDRESS.lzrBTC // lzrBTC contract
    } else if (type === TransactionType.UNWRAP) {
      // Unwrap: burned from user, so transfer.from is the user address
      from = transfer.from // User who unwrapped
      to = '0x0000000000000000000000000000000000000000' // Burn address
    }

    return {
      id: transfer.hash,
      hash: transfer.hash,
      type,
      status,
      from,
      to,
      amount: (Number(transfer.value) / Math.pow(10, Number(transfer.tokenDecimal))).toString(),
      asset: transfer.tokenSymbol,
      sourceNetwork: NetworkType.ARBITRUM,
      destinationNetwork: type === TransactionType.BRIDGE ? NetworkType.BITLAZER : undefined,
      timestamp: Number(transfer.timeStamp),
      blockNumber: Number(transfer.blockNumber),
      explorerUrl: `https://arbiscan.io/tx/${transfer.hash}`,
      gasUsed: transfer.gasUsed,
      gasPrice: transfer.gasPrice,
    }
  }

  private determineTransactionType(tx: ArbiscanTransaction): TransactionType {
    // Check if it's a bridge transaction to L2 Gateway Router
    if (tx.to?.toLowerCase() === L2_GATEWAY_ROUTER.toLowerCase()) {
      return TransactionType.BRIDGE
    }

    // Check for wrap/unwrap based on method ID or function name
    if (tx.functionName) {
      const funcName = tx.functionName.toLowerCase()
      if (funcName.includes('wrap') || funcName.includes('deposit')) {
        return TransactionType.WRAP
      }
      if (funcName.includes('unwrap') || funcName.includes('withdraw')) {
        return TransactionType.UNWRAP
      }
      if (funcName.includes('stake')) {
        return TransactionType.STAKE
      }
      if (funcName.includes('unstake')) {
        return TransactionType.UNSTAKE
      }
    }

    // Default to transfer
    return TransactionType.TRANSFER
  }

  private determineTokenTransferType(transfer: ArbiscanTokenTransfer): TransactionType {
    // Only consider lzrBTC transfers
    if (transfer.contractAddress?.toLowerCase() !== ERC20_CONTRACT_ADDRESS.lzrBTC.toLowerCase()) {
      return TransactionType.TRANSFER
    }

    // Mint (from 0x0) - This is a WRAP operation
    if (transfer.from === '0x0000000000000000000000000000000000000000') {
      return TransactionType.WRAP
    }

    // Burn (to 0x0) - This is an UNWRAP operation
    if (transfer.to === '0x0000000000000000000000000000000000000000') {
      return TransactionType.UNWRAP
    }

    // Bridge to L2 Gateway Router (Arbitrum to Bitlazer)
    if (transfer.to?.toLowerCase() === L2_GATEWAY_ROUTER.toLowerCase()) {
      return TransactionType.BRIDGE
    }

    // Don't show regular transfers as they're internal to other operations
    // We only care about the main operations: WRAP, UNWRAP, BRIDGE
    return TransactionType.TRANSFER
  }
}
