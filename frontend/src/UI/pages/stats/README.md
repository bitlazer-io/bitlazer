# Stats Page Data Sources

This document explains how each statistic and metric on the Stats page is retrieved and calculated.

## PriceHeader Component

### WBTC Price

- **Source**: CoinGecko API
- **Endpoint**: `https://api.coingecko.com/api/v3/simple/price?ids=wrapped-bitcoin&vs_currencies=usd&include_24hr_change=true`
- **Update Frequency**: Every 30 seconds
- **Data**: Current USD price and 24-hour price change percentage

### lzrBTC Price

- **Source**: Pegged 1:1 with WBTC
- **Calculation**: Same as WBTC price
- **Note**: lzrBTC maintains a 1:1 peg with WBTC

### Total Supply

- **Source**: lzrBTC smart contract on Arbitrum
- **Contract**: `0x0c978B2F8F3A0E399DaF5C41e4776757253EE5Df`
- **Method**: `totalSupply()`
- **Chain**: Arbitrum (chainId: 42161)

### Market Cap

- **Calculation**: Total Supply × WBTC Price
- **Formula**: `totalSupply * wbtcPrice`

## NetworkOverview Component

### Arbitrum Block Number

- **Source**: Arbitrum RPC
- **Method**: `getBlockNumber()`
- **Update Frequency**: Every 12 seconds

### Bitlazer L3 Block Number

- **Source**: Bitlazer L3 RPC (mainnet chain)
- **Method**: `getBlockNumber()`
- **Note**: May show "OFFLINE" if L3 connection fails

### Gas Price

- **Source**: Arbitrum RPC
- **Method**: `getGasPrice()`
- **Display**: Converted from Wei to Gwei

### Network Status

- **Logic**: Shows "ONLINE" if data fetching succeeds, "LOADING" during initial load

## WrapStats Component

### Total Wrapped (WBTC → lzrBTC)

- **Source**: lzrBTC contract event logs
- **Event**: `Wrapped(address indexed user, uint256 amount)`
- **Calculation**: Sum of all `Wrapped` event amounts in the last 10,000 blocks

### Total Unwrapped (lzrBTC → WBTC)

- **Source**: lzrBTC contract event logs
- **Event**: `Unwrapped(address indexed user, uint256 amount)`
- **Calculation**: Sum of all `Unwrapped` event amounts in the last 10,000 blocks

### Unique Wrappers

- **Calculation**: Count of unique addresses from `Wrapped` events
- **Method**: Tracks unique `user` addresses in a Set

### Recent Activity

- **Source**: Last 5 `Wrapped` events
- **Data**: Amount, timestamp, transaction hash
- **Display**: Sorted by most recent first

## BridgeStats Component

### Total Bridged to L3

- **Source**: Bitlazer L3 balance (currently using fallback values)
- **Fallback**: 0.000089 BTC
- **Note**: Will read from L3 bridge contract when available

### Total Bridged to Arbitrum

- **Source**: lzrBTC totalSupply on Arbitrum
- **Contract**: `0x0c978B2F8F3A0E399DaF5C41e4776757253EE5Df`
- **Method**: `totalSupply()`

### Pending Bridges

- **Current**: Random value 0-2 (placeholder)
- **Future**: Will read from bridge contract pending transfers

### Average Bridge Time

- **Current**: Static "~15 min"
- **Future**: Will calculate from bridge event timestamps

### 24H Volume

- **Current**: Random value for demonstration
- **Future**: Will calculate from last 24h bridge events

### Distribution Bar

- **Calculation**: Percentage split between L3 and Arbitrum
- **Formula**: `(amountOnChain / totalAmount) * 100`

## StakingStats Component

### Total Pool Size / Total Staked

- **Source**: StakedLZRChef contract on Bitlazer mainnet
- **Contract**: `STAKING_CONTRACTS.StakedLZRChef`
- **Method**: `totalSupply()`
- **Fallback**: 0.000256 lzrBTC

### Current APR

- **Source**: StakedLZRChef contract
- **Method**: `rewardRate()`
- **Calculation**: `(rewardRate * secondsPerYear / totalStaked) * 100`
- **Fallback**: 0.79%

### TVL (USD)

- **Calculation**: Total Staked × BTC Price ($68,000 hardcoded)
- **Formula**: `totalStaked * 68000`

### Number of Stakers

- **Current**: Random 12-26 (placeholder)
- **Future**: Will read from staking contract

### Average Stake Size

- **Calculation**: Total Staked / Number of Stakers
- **Formula**: `totalStaked / numberOfStakers`

### 24H Rewards

- **Calculation**: Reward Rate × Seconds per Day
- **Formula**: `rewardRate * 24 * 60 * 60`

### Total Rewards

- **Current**: Shows 0
- **Future**: Will accumulate distributed rewards from events

## Data Update Intervals

- **Price Data**: 30 seconds (CoinGecko API)
- **Network Stats**: 12 seconds (block numbers, gas)
- **Contract Data**: 30 seconds (wraps, bridges, staking)
- **All Components**: Refresh on mount and at specified intervals

## Fallback Values

When live data is unavailable, components use realistic fallback values to maintain UI consistency:

- WBTC Price: Fetches from CoinGecko or shows loading
- Network blocks: Shows actual block or "OFFLINE"
- Wrap/Bridge stats: Small demo values (0.00001-0.001 range)
- Staking APR: 0.79%
- Gas prices: Shows actual or 0

## Chain Configuration

### Arbitrum (Production)

- Chain ID: 42161
- lzrBTC: `0x0c978B2F8F3A0E399DaF5C41e4776757253EE5Df`
- WBTC: `0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f`

### Bitlazer L3

- Custom mainnet chain configuration
- RPC endpoint configured in `src/web3/chains.tsx`
- Native lzrBTC token support

## Error Handling

All components implement try-catch blocks with console error logging and fallback to demo values to ensure the UI remains functional even when data sources are unavailable.
