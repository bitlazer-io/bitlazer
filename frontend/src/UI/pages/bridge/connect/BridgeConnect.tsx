import { MyModal } from '@components/index'
import ConnectWallet from '@pages/connect-wallet/ConnectWallet'
import React, { FC, useState } from 'react'

interface IBridgeConnect {}

const BridgeConnect: FC<IBridgeConnect> = () => {
  const [openConnectWalletModal, setOpenConnectWalletModal] = useState(false)

  return (
    <form className="flex flex-col gap-7">
      <div className="flex-1 rounded-12xs bg-black border-forestgreen border-[.1875rem] border-solid box-border flex flex-col py-[1.25rem] px-[0.562rem] gap-[1.668rem] ">
        <div className="flex-1 flex items-center justify-center">
          <div className="tracking-[-0.06em] leading-[1.313rem] text-center font-ocrx text-2xl">
            Please connect your wallet to proceed
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-[0.562rem]">
          <button
            className="font-ocrx w-full cursor-pointer rounded-[.115rem] h-[2.875rem] text-lightgreen-100 text-[1.25rem] whitespace-nowrap bg-darkslategray-200 flex py-[0.187rem] px-[0.125rem] transition-all duration-300 group"
            onClick={() => {
              setOpenConnectWalletModal(true)
            }}
          >
            <span className="px-[0.875rem] h-full leading-[50%] pt-3 bg-darkslategray-200 shadow-[-1.8px_-0.9px_3.69px_rgba(215,_215,_215,_0.18)_inset,_1.8px_1.8px_1.84px_rgba(0,_0,_0,_0.91)_inset] rounded-[.115rem] flex items-center justify-center text-center transition-all duration-300 group-hover:bg-dimgray-200 w-full">
              CONNECT WALLET
            </span>
          </button>
          <MyModal
            label={'CONNECT WALLET'}
            width="21.4375rem"
            open={openConnectWalletModal}
            handleClose={() => setOpenConnectWalletModal(false)}
          >
            <ConnectWallet />
          </MyModal>
        </div>
      </div>
    </form>
  )
}

export default BridgeConnect
