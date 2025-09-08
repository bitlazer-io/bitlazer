import { createConfig, CreateConnectorFn, http } from 'wagmi'
import { walletConnect } from 'wagmi/connectors'
import { arbitrumOne, bitlazerL3 } from './chains'

// 1. Get projectId from https://cloud.walletconnect.com
const projectId = 'ae140b2d150397e3e8c039cc1debc614'

// 2. Create wagmiConfig
const metadata = {
  name: 'Bitlazer',
  description: 'Bitlazer DApp',
  url: 'http://localhost:3000', // origin must match your domain & subdomain
  icons: [],
}

const chains = [bitlazerL3, arbitrumOne] as const
const connectors: CreateConnectorFn[] = []
connectors.push(walletConnect({ projectId, metadata, showQrModal: true }))

export const config = createConfig({
  chains,
  transports: {
    [bitlazerL3.id]: http(),
    [arbitrumOne.id]: http(),
    // [testnet.id]: http(),
    // [arbitrumSepolia.id]: http(),
  },
  connectors,
  pollingInterval: 2500,
})
