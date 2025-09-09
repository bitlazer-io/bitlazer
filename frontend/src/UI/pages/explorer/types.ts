export enum TransactionType {
  WRAP = 'wrap',
  UNWRAP = 'unwrap',
  BRIDGE = 'bridge',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  TRANSFER = 'transfer',
}

export enum NetworkType {
  ARBITRUM = 'arbitrum',
  BITLAZER = 'bitlazer',
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

export interface Transaction {
  id: string
  hash: string
  type: TransactionType
  status: TransactionStatus
  from: string
  to: string
  amount: string
  asset: string
  sourceNetwork: NetworkType
  destinationNetwork?: NetworkType
  timestamp: number
  blockNumber: number
  gasUsed?: string
  gasPrice?: string
  fee?: string
  explorerUrl: string
  isInternal?: boolean
}

export interface TransactionFiltersType {
  query?: string
  type?: TransactionType | 'all'
  network?: NetworkType | 'all'
  status?: TransactionStatus
  page: number
  limit: number
  startDate?: string
  endDate?: string
  forceRefresh?: boolean
}

export interface TransactionResponse {
  transactions: Transaction[]
  total: number
  hasMore: boolean
}
