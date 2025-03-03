import { MyModal } from '@components/index'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import ConnectWallet from './ConnectWallet'
import { handleAddL3Chain } from 'src/web3/functions'

export function Account() {
  const { address, isConnected } = useAccount()
  const [openConnectWalletModal, setOpenConnectWalletModal] = useState(false)

  // useEffect(() => {
  //   if (isConnected) {
  //     handleAddL3Chain()
  //   }
  // }, [isConnected])

  return (
    <div>
      {address && (
        <button
          onClick={() => {
            setOpenConnectWalletModal(true)
          }}
          className="text-white"
        >
          {address.slice(0, 6) + '...' + address.slice(-4)}
        </button>
      )}
      <MyModal
        label={'CONNECTED WALLET'}
        width="21.4375rem"
        open={openConnectWalletModal}
        handleClose={() => setOpenConnectWalletModal(false)}
      >
        <ConnectWallet />
      </MyModal>
    </div>
  )
}
