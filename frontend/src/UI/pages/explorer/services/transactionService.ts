import {
  Transaction,
  TransactionFiltersType,
  TransactionResponse,
  TransactionType,
  TransactionStatus,
  NetworkType,
} from '../types'
import { parseAbiItem, formatUnits, createPublicClient, http } from 'viem'
import { arbitrum } from 'wagmi/chains'
import { mainnet } from 'src/web3/chains'
import { ERC20_CONTRACT_ADDRESS, STAKING_CONTRACTS, L2_GATEWAY_ROUTER } from 'src/web3/contracts'

// Create public clients for fetching blockchain data
const arbitrumClient = createPublicClient({
  chain: arbitrum,
  transport: http(),
})

const bitlazerClient = createPublicClient({
  chain: mainnet,
  transport: http(),
})

// Fetch all real transactions from blockchain
const fetchAllTransactions = async (): Promise<Transaction[]> => {
  const allTransactions: Transaction[] = []

  try {
    // Get current blocks
    const arbCurrentBlock = await arbitrumClient.getBlockNumber()
    const l3CurrentBlock = await bitlazerClient.getBlockNumber()

    // Define block ranges (last ~3M blocks to capture more history)
    const arbFromBlock = arbCurrentBlock > 3000000n ? arbCurrentBlock - 3000000n : 0n
    const l3FromBlock = l3CurrentBlock > 3000000n ? l3CurrentBlock - 3000000n : 0n

    // 1. FETCH WRAP TRANSACTIONS (Arbitrum)
    const wrapLogs = await arbitrumClient.getLogs({
      address: ERC20_CONTRACT_ADDRESS.lzrBTC as `0x${string}`,
      event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
      args: {
        from: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      },
      fromBlock: arbFromBlock,
      toBlock: arbCurrentBlock,
    })

    for (const log of wrapLogs) {
      if (log.args && 'to' in log.args && 'value' in log.args) {
        const block = await arbitrumClient.getBlock({ blockHash: log.blockHash! })
        allTransactions.push({
          id: log.transactionHash!,
          hash: log.transactionHash!,
          type: TransactionType.WRAP,
          status: TransactionStatus.CONFIRMED,
          from: '0x0000000000000000000000000000000000000000',
          to: log.args.to as string,
          amount: formatUnits(log.args.value as bigint, 18),
          asset: 'lzrBTC',
          sourceNetwork: NetworkType.ARBITRUM,
          timestamp: Number(block.timestamp),
          blockNumber: Number(log.blockNumber),
          explorerUrl: `https://arbiscan.io/tx/${log.transactionHash}`,
        })
      }
    }

    // 2. FETCH UNWRAP TRANSACTIONS (Arbitrum)
    const unwrapLogs = await arbitrumClient.getLogs({
      address: ERC20_CONTRACT_ADDRESS.lzrBTC as `0x${string}`,
      event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
      args: {
        to: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      },
      fromBlock: arbFromBlock,
      toBlock: arbCurrentBlock,
    })

    for (const log of unwrapLogs) {
      if (log.args && 'from' in log.args && 'value' in log.args) {
        const block = await arbitrumClient.getBlock({ blockHash: log.blockHash! })
        allTransactions.push({
          id: log.transactionHash!,
          hash: log.transactionHash!,
          type: TransactionType.UNWRAP,
          status: TransactionStatus.CONFIRMED,
          from: log.args.from as string,
          to: '0x0000000000000000000000000000000000000000',
          amount: formatUnits(log.args.value as bigint, 18),
          asset: 'lzrBTC',
          sourceNetwork: NetworkType.ARBITRUM,
          timestamp: Number(block.timestamp),
          blockNumber: Number(log.blockNumber),
          explorerUrl: `https://arbiscan.io/tx/${log.transactionHash}`,
        })
      }
    }

    // 3. FETCH BRIDGE TRANSACTIONS (Arbitrum -> Bitlazer)
    const bridgeToL3Logs = await arbitrumClient.getLogs({
      address: ERC20_CONTRACT_ADDRESS.lzrBTC as `0x${string}`,
      event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
      args: {
        to: L2_GATEWAY_ROUTER as `0x${string}`,
      },
      fromBlock: arbFromBlock,
      toBlock: arbCurrentBlock,
    })

    for (const log of bridgeToL3Logs) {
      if (log.args && 'from' in log.args && 'value' in log.args) {
        const block = await arbitrumClient.getBlock({ blockHash: log.blockHash! })
        allTransactions.push({
          id: log.transactionHash!,
          hash: log.transactionHash!,
          type: TransactionType.BRIDGE,
          status: TransactionStatus.CONFIRMED,
          from: log.args.from as string,
          to: L2_GATEWAY_ROUTER,
          amount: formatUnits(log.args.value as bigint, 18),
          asset: 'lzrBTC',
          sourceNetwork: NetworkType.ARBITRUM,
          destinationNetwork: NetworkType.BITLAZER,
          timestamp: Number(block.timestamp),
          blockNumber: Number(log.blockNumber),
          explorerUrl: `https://arbiscan.io/tx/${log.transactionHash}`,
        })
      }
    }

    // 4. FETCH BRIDGE TRANSACTIONS (Bitlazer -> Arbitrum)
    const bridgeFromL3Logs = await bitlazerClient.getLogs({
      address: ERC20_CONTRACT_ADDRESS.lzrBTC as `0x${string}`,
      event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
      args: {
        to: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      },
      fromBlock: l3FromBlock,
      toBlock: l3CurrentBlock,
    })

    for (const log of bridgeFromL3Logs) {
      if (log.args && 'from' in log.args && 'value' in log.args) {
        const block = await bitlazerClient.getBlock({ blockHash: log.blockHash! })
        allTransactions.push({
          id: log.transactionHash!,
          hash: log.transactionHash!,
          type: TransactionType.BRIDGE,
          status: TransactionStatus.CONFIRMED,
          from: log.args.from as string,
          to: '0x0000000000000000000000000000000000000000',
          amount: formatUnits(log.args.value as bigint, 18),
          asset: 'lzrBTC',
          sourceNetwork: NetworkType.BITLAZER,
          destinationNetwork: NetworkType.ARBITRUM,
          timestamp: Number(block.timestamp),
          blockNumber: Number(log.blockNumber),
          explorerUrl: `https://bitlazer.calderaexplorer.xyz/tx/${log.transactionHash}`,
        })
      }
    }

    // 5. FETCH STAKE TRANSACTIONS (Bitlazer)
    const stakeLogs = await bitlazerClient.getLogs({
      address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
      event: parseAbiItem('event Staked(address indexed user, uint256 amount)'),
      fromBlock: l3FromBlock,
      toBlock: l3CurrentBlock,
    })

    for (const log of stakeLogs) {
      if (log.args && 'user' in log.args && 'amount' in log.args) {
        const block = await bitlazerClient.getBlock({ blockHash: log.blockHash! })
        allTransactions.push({
          id: log.transactionHash!,
          hash: log.transactionHash!,
          type: TransactionType.STAKE,
          status: TransactionStatus.CONFIRMED,
          from: log.args.user as string,
          to: STAKING_CONTRACTS.T3RNStakingAdapter,
          amount: formatUnits(log.args.amount as bigint, 18),
          asset: 'lzrBTC',
          sourceNetwork: NetworkType.BITLAZER,
          timestamp: Number(block.timestamp),
          blockNumber: Number(log.blockNumber),
          explorerUrl: `https://bitlazer.calderaexplorer.xyz/tx/${log.transactionHash}`,
        })
      }
    }

    // 6. FETCH UNSTAKE TRANSACTIONS (Bitlazer)
    // First try to fetch Unstaked events directly
    let unstakeProcessed = false
    try {
      const unstakedLogs = await bitlazerClient.getLogs({
        address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
        event: parseAbiItem(
          'event Unstaked(address indexed user, uint256 amount, uint256 rewards, uint256 totalUnstaked)',
        ),
        fromBlock: l3FromBlock,
        toBlock: l3CurrentBlock,
      })

      for (const log of unstakedLogs) {
        if (log.args && 'user' in log.args && 'amount' in log.args) {
          const block = await bitlazerClient.getBlock({ blockHash: log.blockHash! })
          allTransactions.push({
            id: log.transactionHash!,
            hash: log.transactionHash!,
            type: TransactionType.UNSTAKE,
            status: TransactionStatus.CONFIRMED,
            from: log.args.user as string,
            to: STAKING_CONTRACTS.T3RNStakingAdapter,
            amount: formatUnits(log.args.amount as bigint, 18),
            asset: 'lzrBTC',
            sourceNetwork: NetworkType.BITLAZER,
            timestamp: Number(block.timestamp),
            blockNumber: Number(log.blockNumber),
            explorerUrl: `https://bitlazer.calderaexplorer.xyz/tx/${log.transactionHash}`,
          })
        }
      }
      unstakeProcessed = true
    } catch (unstakeError) {
      // If Unstaked event fails, fall back to Transfer events to 0x0 (burns)
      console.log('Falling back to Transfer events for unstaking:', unstakeError)
    }

    // If Unstaked events failed, try Transfer events fallback
    if (!unstakeProcessed) {
      try {
        const unstakeLogs = await bitlazerClient.getLogs({
          address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
          event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
          args: {
            to: '0x0000000000000000000000000000000000000000' as `0x${string}`,
          },
          fromBlock: l3FromBlock,
          toBlock: l3CurrentBlock,
        })

        // Process unstaking events (burns = transfers to 0x0)
        for (const log of unstakeLogs) {
          if (log.args && 'from' in log.args && 'value' in log.args) {
            const block = await bitlazerClient.getBlock({ blockHash: log.blockHash! })
            allTransactions.push({
              id: log.transactionHash!,
              hash: log.transactionHash!,
              type: TransactionType.UNSTAKE,
              status: TransactionStatus.CONFIRMED,
              from: log.args.from as string,
              to: '0x0000000000000000000000000000000000000000',
              amount: formatUnits(log.args.value as bigint, 18),
              asset: 'lzrBTC',
              sourceNetwork: NetworkType.BITLAZER,
              timestamp: Number(block.timestamp),
              blockNumber: Number(log.blockNumber),
              explorerUrl: `https://bitlazer.calderaexplorer.xyz/tx/${log.transactionHash}`,
            })
          }
        }
      } catch (fallbackError) {
        console.error('Error fetching unstake transactions with fallback:', fallbackError)
      }
    }
  } catch (error) {
    console.error('Error fetching blockchain transactions:', error)
  }

  // Remove any duplicate transactions based on hash
  const uniqueTransactions = allTransactions.filter(
    (tx, index, self) => index === self.findIndex((t) => t.hash === tx.hash),
  )

  // Sort by timestamp (most recent first)
  return uniqueTransactions.sort((a, b) => b.timestamp - a.timestamp)
}

export const fetchTransactions = async (filters: TransactionFiltersType): Promise<TransactionResponse> => {
  // Fetch real transactions from blockchain
  const allTransactions = await fetchAllTransactions()

  let filtered = [...allTransactions]

  // Apply filters
  if (filters.query) {
    const query = filters.query.toLowerCase()
    filtered = filtered.filter(
      (tx) =>
        tx.hash.toLowerCase().includes(query) ||
        tx.from.toLowerCase().includes(query) ||
        tx.to.toLowerCase().includes(query),
    )
  }

  if (filters.type) {
    filtered = filtered.filter((tx) => tx.type === filters.type)
  }

  if (filters.network) {
    filtered = filtered.filter(
      (tx) => tx.sourceNetwork === filters.network || tx.destinationNetwork === filters.network,
    )
  }

  if (filters.status) {
    filtered = filtered.filter((tx) => tx.status === filters.status)
  }

  // Pagination
  const start = (filters.page - 1) * filters.limit
  const end = start + filters.limit
  const paginated = filtered.slice(start, end)

  return {
    transactions: paginated,
    total: filtered.length,
    hasMore: end < filtered.length,
  }
}
