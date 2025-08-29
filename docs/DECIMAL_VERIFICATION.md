# Decimal Verification for lzrBTC Conversion

## Base Facts (Verified from Web Search)
- **Bitcoin/WBTC**: 8 decimals (1 BTC = 10^8 satoshis = 100,000,000 satoshis)
- **lzrBTC**: 18 decimals (standard ERC20)
- **Conversion Rate**: 1 satoshi = 1000 lzrBTC

## Mathematical Verification

### 1. WBTC to lzrBTC Conversion

**Given:**
- 1 WBTC unit (smallest) = 1 satoshi
- 1 satoshi = 1000 lzrBTC
- WBTC has 8 decimals
- lzrBTC has 18 decimals

**Calculation:**
```
1 WBTC (full token) = 10^8 WBTC units (satoshis)
1 WBTC = 10^8 satoshis × 1000 lzrBTC/satoshi
1 WBTC = 10^8 × 10^3 lzrBTC tokens
1 WBTC = 10^11 lzrBTC tokens (100,000,000,000 lzrBTC)

In smart contract units:
1 WBTC unit input = 1 satoshi
1 satoshi needs to become 1000 lzrBTC tokens = 1000 × 10^18 lzrBTC units

WBTC amount (8 decimals) → lzrBTC amount (18 decimals)
Multiplication factor = 1000 × 10^18 = 10^21

So: lzrBTC_units = WBTC_units × 10^21
```

### 2. lzrBTC to WBTC Conversion (Reverse)

```
lzrBTC_units (18 decimals) → WBTC_units (8 decimals)
Division factor = 10^21

So: WBTC_units = lzrBTC_units / 10^21
```

## Code Verification

### Smart Contract (lBTC.sol)
```solidity
// CORRECT: Mint function
uint256 mintAmount = __apply8To18DecimalsConversion
    ? amount * 10 ** 21  // ✅ Correct: 10^21 factor
    : amount;

// CORRECT: Burn function  
uint256 burnAmount = __apply8To18DecimalsConversion
    ? (amount / 10 ** 21)  // ✅ Correct: divide by 10^21
    : amount;
```

### Frontend Conversion (lzrBTCConversion.ts)
```typescript
// CORRECT: Conversion factor
export const WBTC_TO_LZRBTC_FACTOR = 10n ** 21n  // ✅ Correct

// CORRECT: WBTC to lzrBTC
export function wbtcToLzrBTC(wbtcAmount: bigint): bigint {
  return wbtcAmount * WBTC_TO_LZRBTC_FACTOR  // ✅ Correct: multiply by 10^21
}

// CORRECT: lzrBTC to WBTC
export function lzrBTCToWbtc(lzrBTCAmount: bigint): bigint {
  return lzrBTCAmount / WBTC_TO_LZRBTC_FACTOR  // ✅ Correct: divide by 10^21
}
```

## Display Examples

### Example 1: User wraps 1 WBTC
- Input: 1 WBTC = 1 × 10^8 WBTC units
- Conversion: 1 × 10^8 × 10^21 = 10^29 lzrBTC units
- Display: 10^29 / 10^18 = 10^11 = 100,000,000,000 lzrBTC tokens ✅

### Example 2: User wraps 0.00000001 WBTC (1 satoshi)
- Input: 0.00000001 WBTC = 1 WBTC unit
- Conversion: 1 × 10^21 = 10^21 lzrBTC units
- Display: 10^21 / 10^18 = 10^3 = 1000 lzrBTC tokens ✅

### Example 3: User unwraps 1000 lzrBTC
- Input: 1000 lzrBTC = 1000 × 10^18 = 10^21 lzrBTC units
- Conversion: 10^21 / 10^21 = 1 WBTC unit
- Display: 1 / 10^8 = 0.00000001 WBTC (1 satoshi) ✅

## UI Display Verification

### BridgeWrap.tsx
```typescript
// Display shows: "1 WBTC = 100,000,000,000 lzrBTC" ✅ Correct
// This equals: 1 BTC = 100 million satoshis × 1000 = 100 billion lzrBTC
```

### PriceHeader.tsx
```typescript
// Display shows: "1 SAT = 1000 lzrBTC" ✅ Correct
// Price calculation:
export function calculateLzrBTCPrice(wbtcPriceUSD: number): number {
  return wbtcPriceUSD / 100_000_000_000  // ✅ Correct: divide by 100 billion
}
```

## Dust Handling in Smart Contract
The dust collection in the burn function correctly handles remainder from division:
```solidity
uint256 dust = __apply8To18DecimalsConversion
    ? amount - burnAmount * 10 ** 21  // ✅ Correct: remainder calculation
    : 0;
```

## CONCLUSION
✅ ALL DECIMAL CONVERSIONS ARE MATHEMATICALLY CORRECT
- The 10^21 factor correctly converts between 8-decimal WBTC and 18-decimal lzrBTC with 1000x multiplier
- 1 satoshi = 1000 lzrBTC tokens (human readable)
- 1 WBTC = 100,000,000,000 lzrBTC tokens (100 billion)
- Display values correctly show the human-readable amounts
- Price calculations properly account for the conversion rate