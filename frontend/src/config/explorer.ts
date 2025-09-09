// Block Explorer API Configuration
export const EXPLORER_CONFIG = {
  arbiscan: {
    apiUrl: import.meta.env.VITE_ARBISCAN_API_URL || 'https://api.arbiscan.io/api',
    apiKey: import.meta.env.VITE_ARBISCAN_API_KEY || '',
    rateLimit: {
      requestsPerSecond: 5,
      maxRetries: 3,
      retryDelay: 1000,
    },
  },
  bitlazer: {
    apiUrl: import.meta.env.VITE_BITLAZER_EXPLORER_API_URL || 'https://bitlazer.calderaexplorer.xyz/api',
    apiKey: '', // Bitlazer Explorer API is free and doesn't require a key
    rateLimit: {
      requestsPerSecond: 10,
      maxRetries: 3,
      retryDelay: 1000,
    },
  },
  defaultPageSize: 100,
  maxPageSize: 10000,
  cacheTimeout: 60000, // 1 minute
}

// Transaction status mapping
export const TX_STATUS_MAP = {
  '0': 'failed',
  '1': 'success',
  '': 'pending',
} as const

// Network chain IDs
export const CHAIN_IDS = {
  arbitrum: 42161,
  bitlazer: 2021,
} as const
