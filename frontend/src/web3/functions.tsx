import { getWalletClient } from '@wagmi/core'
import { config } from './config'
import { arbitrum } from 'wagmi/chains'
import { mainnet } from './chains'

export const handleChainSwitch = async (toMainnet: boolean) => {
  const walletClient = await getWalletClient(config, {
    chainId: mainnet.id,
  })
  if (toMainnet) {
    await walletClient.addChain({
      chain: mainnet,
    })
    await walletClient.switchChain({
      id: mainnet.id,
    })
  } else {
    await walletClient.addChain({
      chain: arbitrum,
    })
    await walletClient.switchChain({
      id: arbitrum.id,
    })
  }
}

export const handleAddL3Chain = async () => {
  const walletClient = await getWalletClient(config, {
    chainId: mainnet.id,
  })
  await walletClient.addChain({
    chain: mainnet,
  })
}
