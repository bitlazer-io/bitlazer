import { FC } from 'react'
import { useAccount } from 'wagmi'
import { arbitrum } from 'wagmi/chains'

interface ITXToast {
  message: string
  txHash?: string
}

const TXToast: FC<ITXToast> = ({ message, txHash }) => {
  const { chainId } = useAccount()

  // Determine the correct explorer URL based on the chain
  const getExplorerUrl = (hash: string) => {
    if (chainId === arbitrum.id) {
      return `https://arbiscan.io/tx/${hash}`
    } else {
      // Bitlazer network (mainnet)
      return `https://bitlazer.calderaexplorer.xyz/tx/${hash}`
    }
  }

  return (
    <div className="self-stretch rounded-[.115rem] bg-forestgreen flex flex-col py-[0.375rem] px-[0.25rem] font-ocrx min-h-[5.5rem] min-w-[20rem]">
      <div className="self-stretch shadow-[-1.8px_-0.9px_3.69px_rgba(215,_215,_215,_0.18)_inset,_1.8px_1.8px_1.84px_rgba(0,_0,_0,_0.91)_inset] rounded-[.115rem] bg-darkolivegreen-200 flex flex-col items-center justify-center flex-1 px-[1.25rem] py-[0.75rem]">
        <div className="text-lightgreen-100 font-ocrx uppercase text-2xl text-center leading-relaxed">{message}</div>
        {txHash && (
          <a
            href={getExplorerUrl(txHash)}
            target="_blank"
            rel="noreferrer"
            className="text-lightgreen-100 hover:text-white text-sm mt-2 break-all"
          >
            TX Hash: {txHash}
          </a>
        )}
      </div>
    </div>
  )
}

export default TXToast
