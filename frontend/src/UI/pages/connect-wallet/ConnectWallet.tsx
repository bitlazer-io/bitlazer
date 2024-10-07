import React, { FC } from 'react'
import { useAccount, useDisconnect, useEnsAvatar, useEnsName } from 'wagmi'
import { WalletOptions } from './WalletOptions'

interface IConnectWallet { }

const ConnectWallet: FC<IConnectWallet> = () => {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  return (
    <div className="flex-1 rounded-12xs bg-black border-forestgreen border-[.1875rem] border-solid box-border flex flex-col py-[1.25rem] px-[0.562rem] gap-[1.668rem] ">
      <div className="tracking-[-0.06em] leading-[1.25rem]">
        {isConnected ? (
          "You have connected wallet:"
        ) : (
          "Choose wallet to connect:"
        )}
      </div>
      <div className="flex-1 flex flex-col gap-[0.562rem]">
        {isConnected && address ? (
          <>
            {address}
            <button
              className="font-ocr-x-trial w-full cursor-pointer rounded-[.115rem] h-[2.875rem] text-lightgreen-100 text-[1.25rem] whitespace-nowrap bg-darkslategray-200 flex py-[0.187rem] px-[0.125rem] transition-all duration-300 group"
              onClick={() => disconnect()}
            >
              <span className="px-[0.875rem] h-full bg-darkslategray-200 shadow-[-1.8px_-0.9px_3.69px_rgba(215,_215,_215,_0.18)_inset,_1.8px_1.8px_1.84px_rgba(0,_0,_0,_0.91)_inset] rounded-[.115rem] flex items-center justify-center text-center transition-all duration-300 group-hover:bg-dimgray-200 w-full">
                DISCONNECT
              </span>
            </button>
          </>
        ) : (
          <WalletOptions />
        )}
        {/* <button className="font-ocr-x-trial w-full cursor-pointer rounded-[.115rem] h-[2.875rem] text-lightgreen-100 text-[1.25rem] whitespace-nowrap bg-darkslategray-200 flex py-[0.187rem] px-[0.125rem] transition-all duration-300 group">
          <span className="px-[0.875rem] h-full bg-darkslategray-200 shadow-[-1.8px_-0.9px_3.69px_rgba(215,_215,_215,_0.18)_inset,_1.8px_1.8px_1.84px_rgba(0,_0,_0,_0.91)_inset] rounded-[.115rem] flex items-center justify-center text-center transition-all duration-300 group-hover:bg-dimgray-200 w-full">
            METAMASK
          </span>
        </button>
        <button className="font-ocr-x-trial w-full cursor-pointer rounded-[.115rem] h-[2.875rem] text-lightgreen-100 text-[1.25rem] whitespace-nowrap bg-darkslategray-200 flex py-[0.187rem] px-[0.125rem] transition-all duration-300 group">
          <span className="px-[0.875rem] h-full bg-darkslategray-200 shadow-[-1.8px_-0.9px_3.69px_rgba(215,_215,_215,_0.18)_inset,_1.8px_1.8px_1.84px_rgba(0,_0,_0,_0.91)_inset] rounded-[.115rem] flex items-center justify-center text-center transition-all duration-300 group-hover:bg-dimgray-200 w-full">
            WALLET CONNECT
          </span>
        </button> */}
      </div>
    </div>
  )
}

export default ConnectWallet
