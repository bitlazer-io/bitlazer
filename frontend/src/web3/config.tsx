import { arbitrum, arbitrumSepolia, sepolia } from 'viem/chains'
import { devnet, mainnet } from './chains'
import { createConfig, CreateConnectorFn, http } from 'wagmi'
import { walletConnect } from 'wagmi/connectors'

// 1. Get projectId from https://cloud.walletconnect.com
const projectId = 'ae140b2d150397e3e8c039cc1debc614'

// 2. Create wagmiConfig
const metadata = {
  name: 'Bitlazer',
  description: 'Bitlazer DApp',
  url: 'http://localhost:3000', // origin must match your domain & subdomain
  icons: [],
}

const chains = [devnet, arbitrumSepolia, arbitrum] as const
const connectors: CreateConnectorFn[] = []
connectors.push(walletConnect({ projectId, metadata, showQrModal: true }))

export const config = createConfig({
  chains,
  transports: {
    [devnet.id]: http(),
    [arbitrumSepolia.id]: http(),
    [arbitrum.id]: http(),
    // [devnet.id]: http(),
    // [testnet.id]: http(),
    // [mainnet.id]: http(),
  },
  connectors,
})
