export type TransactionType = 'bridge' | 'bridge-reverse' | 'wrap' | 'unwrap' | 'stake' | 'unstake'

export type TransactionStatus = 'pending' | 'confirming' | 'completed' | 'failed'

export type TransactionStage =
  | 'initiating'
  | 'submitted'
  | 'confirming'
  | 'bridging'
  | 'finalizing'
  | 'completed'
  | 'failed'

export interface PendingTransaction {
  id: string
  type: TransactionType
  status: TransactionStatus
  stage: TransactionStage
  fromChain: string
  toChain: string
  fromToken: string
  toToken: string
  amount: string
  timestamp: number
  estimatedTime: number // in minutes
  txHash: string
  fromChainId: number
  toChainId?: number
  explorerUrl: string
}

export interface TransactionStageInfo {
  stage: TransactionStage
  label: string
  description: string
  estimatedDuration: number // in minutes
}

export const TRANSACTION_STAGES: Record<TransactionType, TransactionStageInfo[]> = {
  bridge: [
    { stage: 'initiating', label: 'Initiating', description: 'Starting bridge transaction', estimatedDuration: 1 },
    { stage: 'submitted', label: 'Submitted', description: 'Transaction sent to Arbitrum', estimatedDuration: 2 },
    { stage: 'confirming', label: 'Confirming', description: 'Awaiting confirmations', estimatedDuration: 5 },
    { stage: 'bridging', label: 'Bridging', description: 'Processing cross-chain transfer', estimatedDuration: 10 },
    { stage: 'finalizing', label: 'Finalizing', description: 'Completing on Bitlazer', estimatedDuration: 2 },
    { stage: 'completed', label: 'Completed', description: 'Tokens available on Bitlazer', estimatedDuration: 0 },
  ],
  'bridge-reverse': [
    { stage: 'initiating', label: 'Initiating', description: 'Starting withdrawal', estimatedDuration: 1 },
    { stage: 'submitted', label: 'Submitted', description: 'Transaction sent to Bitlazer', estimatedDuration: 2 },
    { stage: 'confirming', label: 'Confirming', description: 'Awaiting confirmations', estimatedDuration: 5 },
    {
      stage: 'bridging',
      label: 'Bridging',
      description: 'Processing withdrawal (up to 7 days)',
      estimatedDuration: 10080,
    }, // 7 days
    { stage: 'finalizing', label: 'Finalizing', description: 'Completing on Arbitrum', estimatedDuration: 2 },
    { stage: 'completed', label: 'Completed', description: 'Tokens available on Arbitrum', estimatedDuration: 0 },
  ],
  wrap: [
    { stage: 'initiating', label: 'Initiating', description: 'Starting wrap process', estimatedDuration: 1 },
    { stage: 'submitted', label: 'Submitted', description: 'Transaction sent to network', estimatedDuration: 1 },
    { stage: 'confirming', label: 'Confirming', description: 'Awaiting confirmations', estimatedDuration: 3 },
    { stage: 'completed', label: 'Completed', description: 'Tokens wrapped successfully', estimatedDuration: 0 },
  ],
  unwrap: [
    { stage: 'initiating', label: 'Initiating', description: 'Starting unwrap process', estimatedDuration: 1 },
    { stage: 'submitted', label: 'Submitted', description: 'Transaction sent to network', estimatedDuration: 1 },
    { stage: 'confirming', label: 'Confirming', description: 'Awaiting confirmations', estimatedDuration: 3 },
    { stage: 'completed', label: 'Completed', description: 'Tokens unwrapped successfully', estimatedDuration: 0 },
  ],
  stake: [
    { stage: 'initiating', label: 'Initiating', description: 'Starting stake process', estimatedDuration: 1 },
    { stage: 'submitted', label: 'Submitted', description: 'Transaction sent to network', estimatedDuration: 1 },
    { stage: 'confirming', label: 'Confirming', description: 'Awaiting confirmations', estimatedDuration: 3 },
    { stage: 'completed', label: 'Completed', description: 'Tokens staked successfully', estimatedDuration: 0 },
  ],
  unstake: [
    { stage: 'initiating', label: 'Initiating', description: 'Starting unstake process', estimatedDuration: 1 },
    { stage: 'submitted', label: 'Submitted', description: 'Transaction sent to network', estimatedDuration: 1 },
    { stage: 'confirming', label: 'Confirming', description: 'Awaiting confirmations', estimatedDuration: 3 },
    { stage: 'completed', label: 'Completed', description: 'Tokens unstaked successfully', estimatedDuration: 0 },
  ],
}
