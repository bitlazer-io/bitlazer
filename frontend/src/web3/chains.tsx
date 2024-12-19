import { type Chain } from 'viem'

// export const devnet = {
//   id: 40670607008,
//   name: 'Bitlazer Devnet',
//   nativeCurrency: { name: 'LazerBTC', symbol: 'lzrBTC', decimals: 18 },
//   rpcUrls: {
//     default: { http: ['https://devnet.bitlazer.io'] },
//   },
// } as const satisfies Chain

// export const testnet = {
//   id: 292393,
//   name: 'Bitlazer Testnet',
//   nativeCurrency: { name: 'LazerBTC', symbol: 'lzrBTC', decimals: 18 },
//   rpcUrls: {
//     default: { http: ['https://rpc.testnet.bitlazer.io/http'] },
//   },
// } as const satisfies Chain

export const mainnet = {
  id: 14235,
  name: 'Bitlazer Mainnet',
  nativeCurrency: { name: 'LazerBTC', symbol: 'lzrBTC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://bitlazer.calderachain.xyz/http'] },
  },
} as const satisfies Chain
