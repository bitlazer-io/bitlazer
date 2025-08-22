# Stats Page Data Fetching Documentation

This document explains how each value displayed on the Stats page is fetched and calculated.

## Overview

The Stats page (`/stats`) displays real-time blockchain and market data across multiple components. All data is fetched using either blockchain RPC calls via Wagmi hooks or external APIs.

---

## 1. PriceHeader Component

### lzrBTC Price
- **Source**: CoinGecko API
- **Endpoint**: `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`
- **Implementation**: `src/UI/components/stats/PriceHeader.tsx`
- **Update Frequency**: Every 30 seconds
- **Note**: Uses Bitcoin price as lzrBTC is pegged to BTC

### WBTC Price
- **Source**: Same as lzrBTC (Bitcoin price from CoinGecko)
- **Value**: Identical to lzrBTC price

### Total Supply
- **Source**: lzrBTC smart contract
- **Method**: `totalSupply()`
- **Contract**: `0x0c978B2F8F3A0E399DaF5C41e4776757253EE5Df` (Arbitrum)
- **Decimals**: 18 (NOT 8 like BTC)
- **Hook**: `useReadContract` from Wagmi

### Market Cap
- **Calculation**: `totalSupply * btcPrice`
- **Format**: USD with proper formatting (K, M, B suffixes)

### 24h Price Change
- **Source**: CoinGecko API (included in price response)
- **Field**: `bitcoin.usd_24h_change`
- **Display**: Percentage with color coding (green for positive, red for negative)

---

## 2. NetworkOverview Component

### Total Value Locked (TVL)
- **Calculation**: `totalSupply * btcPrice`
- **Note**: Currently same as Market Cap, represents total BTC value locked in protocol

### Active Wallets
- **Source**: Currently using placeholder data
- **TODO**: Integrate with indexer or analytics service
- **Fallback**: 1,247 (static)

### Transactions (24h)
- **Source**: Currently using placeholder data
- **TODO**: Integrate with blockchain indexer
- **Fallback**: 3,456 (static)

### Block Height
- **Source**: Bitlazer L3 RPC
- **Method**: `provider.getBlockNumber()`
- **Chain**: Bitlazer L3 (chainId: 14235)
- **RPC**: `https://bitlazer.calderachain.xyz/http`

### Average Block Time
- **Source**: Calculated based on block production
- **Value**: ~3 seconds (Bitlazer L3 standard)

### Gas Price
- **Source**: Bitlazer L3 RPC
- **Method**: `provider.getGasPrice()`
- **Format**: Gwei (converted from Wei)

---

## 3. WrapStats Component

### Total Wrapped
- **Calculation**: Same as Total Supply from lzrBTC contract
- **Method**: `totalSupply()`
- **Decimals**: 18

### Total Unwrapped
- **Source**: Currently calculated as placeholder
- **TODO**: Track via event logs or indexer
- **Fallback**: 0

### Wrap Transactions
- **Source**: Currently using generated data
- **TODO**: Query from event logs
- **Fallback**: Random between 45-60

### Average Wrap Amount
- **Calculation**: `totalWrapped / wrapTransactions`
- **Format**: BTC with 6 decimal places

### Largest Wrap (24h)
- **Source**: Currently using generated data
- **TODO**: Query from indexed events
- **Fallback**: Random between 0.5-2 BTC

### Wrap Volume (24h)
- **Source**: Currently using generated data
- **TODO**: Calculate from recent wrap events
- **Fallback**: Random calculation based on total wrapped

---

## 4. BridgeStats Component

### Bridge Volume (24h)
- **Source**: Currently using placeholder data
- **TODO**: Aggregate from bridge contract events
- **Fallback**: Calculated as percentage of total supply

### Bridge Transactions
- **Source**: Currently using generated data
- **TODO**: Count from indexed bridge events
- **Fallback**: Random between 12-25

### Average Bridge Amount
- **Calculation**: `bridgeVolume / bridgeTransactions`

### Supported Chains
- **Source**: Static configuration
- **Value**: 3 (Ethereum, Arbitrum, Bitlazer L3)

### Pending Bridges
- **Source**: Currently static
- **TODO**: Query from bridge contract state
- **Fallback**: Random between 2-5

### Bridge Fees Collected
- **Source**: Currently calculated as percentage
- **TODO**: Sum from fee collection events
- **Calculation**: `bridgeVolume * 0.001` (0.1% fee assumption)

---

## 5. StakingStats Component

### Total Pool Size
- **Source**: StakeAdapter contract
- **Method**: `totalSupply()`
- **Contract**: `0xDEB231082389Db887c9951e2FB6359a86B6F825b` (Bitlazer L3)
- **Decimals**: 18

### Current APR
- **Source**: StakeAdapter contract
- **Method**: `getApy()`
- **IMPORTANT**: Returns direct percentage value (e.g., 33333 = 33,333%)
- **Note**: NOT basis points - no division needed for display

### TVL (USD)
- **Calculation**: `totalStaked * btcPrice`
- **Format**: USD with proper formatting

### Number of Stakers
- **Source**: Currently using generated data
- **TODO**: Track unique staker addresses
- **Fallback**: Random between 12-27

### Average Stake Size
- **Calculation**: `totalStaked / numberOfStakers`

### 24H Rewards
- **Calculation**: `(totalStaked * APR / 100) / 365`
- **Note**: Daily rewards based on APR

### Total Rewards
- **Source**: Currently static at 0
- **TODO**: Sum from reward distribution events

### Target APY (Optional)
- **Source**: StakeAdapter contract
- **Method**: `targetApyBps()`
- **Note**: This IS in basis points (divide by 100 for percentage)

---

## Technical Implementation Details

### Wagmi Hooks Used
```typescript
// For contract reads
useReadContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'methodName',
  chainId: CHAIN_ID,
})

// For blockchain data
useBlockNumber({ chainId: CHAIN_ID })
usePublicClient({ chainId: CHAIN_ID })
```

### Chain Configuration
```typescript
// Arbitrum Mainnet
chainId: 42161
rpc: "https://arb1.arbitrum.io/rpc"

// Bitlazer L3
chainId: 14235
rpc: "https://bitlazer.calderachain.xyz/http"
```

### Update Intervals
- Price data: 30 seconds
- Blockchain data: 12 seconds (block time)
- Static data: On page load only

### Error Handling
- All components use try-catch blocks
- Fallback to placeholder data on errors
- Loading states shown during data fetch
- Console logging for debugging

---

## Data Flow

1. **Initial Load**: Components mount and initiate data fetches
2. **Loading State**: Skeleton loaders displayed
3. **Data Fetch**: Parallel requests to RPC and APIs
4. **Processing**: Format numbers, calculate derived values
5. **Display**: Render formatted data with animations
6. **Updates**: Periodic refetch based on intervals

---

## Future Improvements

1. **Event Indexing**: Implement subgraph or indexer for historical data
2. **WebSocket Connections**: Real-time updates for critical metrics
3. **Caching Layer**: Redis or similar for frequently accessed data
4. **Analytics Service**: Dedicated service for aggregated statistics
5. **Historical Charts**: Time-series data for trends
6. **User-specific Stats**: Personalized statistics for connected wallets

---

## Decimal Precision Notes

**CRITICAL**: lzrBTC uses 18 decimals, not 8 like native BTC
- Always use `formatUnits(value, 18)` for lzrBTC values
- WBTC on Arbitrum uses 8 decimals
- Gas prices use 18 decimals (Wei to Ether conversion)

---

## Contract Addresses Reference

### Arbitrum Mainnet
- lzrBTC: `0x0c978B2F8F3A0E399DaF5C41e4776757253EE5Df`
- WBTC: `0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f`

### Bitlazer L3
- StakeAdapter: `0xDEB231082389Db887c9951e2FB6359a86B6F825b`
- StakedLZRChef: `0x42e0A9cDE272C893763becc1e23D3C8708b39414`