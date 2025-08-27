// Bridge configuration constants
export const BRIDGE_CONFIG = {
  // Bridge timing estimates (in minutes)
  ARBITRUM_TO_BITLAZER_TIME: 15,
  BITLAZER_TO_ARBITRUM_TIME: 10080, // 7 days in minutes

  // Protocol information
  PROTOCOL_NAME: 'Caldera Rollup Bridge',

  // Gas estimates for bridge operations
  BRIDGE_GAS_LIMIT: 500000n, // Estimated gas for bridge transaction

  // BTC price cache duration (5 minutes)
  PRICE_CACHE_DURATION: 300000,

  // USD conversion for fees
  ETH_TO_USD_ESTIMATE: 2500, // Fallback ETH price in USD
} as const

// Helper function to format time duration
export const formatBridgeTime = (minutes: number): string => {
  if (minutes < 60) {
    return `~${minutes} minutes`
  } else if (minutes < 1440) {
    const hours = Math.round(minutes / 60)
    return `~${hours} hour${hours !== 1 ? 's' : ''}`
  } else {
    const days = Math.round(minutes / 1440)
    return `Up to ${days} day${days !== 1 ? 's' : ''}`
  }
}

// Network fee estimation helper
export const estimateNetworkFee = (gasPrice: bigint | null, ethPrice?: number): string => {
  if (!gasPrice) return '~$2-5' // Fallback to current estimate

  try {
    // Calculate gas cost in ETH
    const gasCostWei = gasPrice * BRIDGE_CONFIG.BRIDGE_GAS_LIMIT
    const gasCostEth = Number(gasCostWei) / 1e18

    // Convert to USD using provided ETH price or fallback
    const ethPriceUsd = ethPrice || BRIDGE_CONFIG.ETH_TO_USD_ESTIMATE
    const gasCostUsd = gasCostEth * ethPriceUsd

    // Format as USD range (add buffer for price volatility)
    const minFee = Math.floor(gasCostUsd * 0.8)
    const maxFee = Math.ceil(gasCostUsd * 1.5)

    // Ensure minimum difference between min and max
    if (maxFee <= minFee) {
      const adjustedMax = minFee + 1
      return `~$${Math.max(1, minFee)}-${Math.max(2, adjustedMax)}`
    }

    return `~$${Math.max(1, minFee)}-${Math.max(2, maxFee)}`
  } catch (error) {
    console.error('Error calculating network fee:', error)
    return '~$2-5' // Fallback
  }
}
