import { defineChain, type Chain } from 'viem'
import { arbitrum } from 'viem/chains'

// Define our custom L3 chain
const bitlazerL3Chain = defineChain({
  id: 14235,
  name: 'Bitlazer L3',
  nativeCurrency: {
    decimals: 18,
    name: 'LazerBTC',
    symbol: 'lzrBTC',
  },
  rpcUrls: {
    default: {
      http: ['https://bitlazer.calderachain.xyz/http'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Bitlazer Explorer',
      url: 'https://bitlazer.calderaexplorer.xyz',
    },
  },
})

// Customize Arbitrum chain
const arbitrumChain = defineChain({
  ...arbitrum,
  name: 'Arbitrum One',
  rpcUrls: {
    default: {
      http: ['https://arb1.arbitrum.io/rpc'],
    },
  },
})

// Network metadata type
export interface NetworkMetadata {
  id: number
  name: string
  chain: Chain
  icon: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  explorerUrl?: string
  bridgeUrl?: string
}

// Centralized network configuration - single source of truth
export const SUPPORTED_CHAINS = {
  arbitrumOne: {
    id: 42161,
    name: 'Arbitrum One',
    chain: arbitrumChain,
    icon: '/icons/crypto/arbitrum-color.svg',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    explorerUrl: 'https://arbiscan.io',
    bridgeUrl: 'https://bridge.arbitrum.io',
  },
  bitlazerL3: {
    id: 14235,
    name: 'Bitlazer',
    chain: bitlazerL3Chain,
    icon: '/images/bitlazer-icon.svg',
    nativeCurrency: {
      name: 'LazerBTC',
      symbol: 'lzrBTC',
      decimals: 18,
    },
    explorerUrl: 'https://bitlazer.calderaexplorer.xyz',
    bridgeUrl: 'https://bitlazer.bridge.caldera.xyz',
  },
} as const

export type NetworkId = keyof typeof SUPPORTED_CHAINS

// Helper functions
export function getChainById(chainId: number): NetworkMetadata | undefined {
  return Object.values(SUPPORTED_CHAINS).find((chain) => chain.id === chainId)
}

export function getChainByName(name: string): NetworkMetadata | undefined {
  return Object.values(SUPPORTED_CHAINS).find((chain) => chain.name.toLowerCase() === name.toLowerCase())
}

export function isLayer3Network(chainId: number): boolean {
  return chainId === SUPPORTED_CHAINS.bitlazerL3.id
}

// Exports for backward compatibility and convenience
export const arbitrumOne = SUPPORTED_CHAINS.arbitrumOne.chain
export const bitlazerL3 = SUPPORTED_CHAINS.bitlazerL3.chain
export const mainnet = SUPPORTED_CHAINS.bitlazerL3.chain // Alias for existing code
