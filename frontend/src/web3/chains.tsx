import { type Chain } from 'viem'

export const devnet = {
  id: 40670607008,
  name: 'Bitlazer Devnet',
  nativeCurrency: { name: 'LazerBTC', symbol: 'LBTC', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://devnet.bitlazer.io:8449'] },
  },
} as const satisfies Chain

export const testnet = {
  id: 40670607008,
  name: 'Bitlazer Testnet',
  nativeCurrency: { name: 'LazerBTC', symbol: 'LBTC', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://testnet.bitlazer.io:8449'] },
  },
} as const satisfies Chain

export const mainnet = {
  id: 40670607008,
  name: 'Bitlazer Mainnet',
  nativeCurrency: { name: 'LazerBTC', symbol: 'LBTC', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://mainnet.bitlazer.io:8449'] },
  },
} as const satisfies Chain
