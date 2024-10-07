import { type Chain } from 'viem'

export const devnet = {
    id: 40670607008,
    name: 'Bitlazer Devnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://cloudflare-eth.com'] },
    },
} as const satisfies Chain