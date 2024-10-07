import React, { FC, useEffect, useState } from 'react'
import BridgeDeposit from './deposit/BridgeDeposit'
import BridgeStake from './stake/BridgeStake'
import BridgeWithdraw from './withdraw/BridgeWithdraw'
import { useAccount } from 'wagmi'
import BridgeConnect from './connect/BridgeConnect'
import clsx from 'clsx'

interface IBridge {}
interface BridgeTab {
  id: string
  name: string
}

const Bridge: FC<IBridge> = () => {
  const tabs: BridgeTab[] = [
    { id: 'deposit', name: 'DEPOSIT' },
    { id: 'stake', name: 'STAKE' },
    { id: 'withdraw', name: 'WITHDRAW' },
    { id: 'connect', name: 'CONNECT WALLET' },
  ]

  const [activeTabId, setActiveTabId] = useState<string>('connect')
  const [currentProgress, setCurrentProgress] = useState<number>(0)

  const { isConnected } = useAccount()

  const renderContent = () => {
    switch (activeTabId) {
      case 'deposit':
        return <BridgeDeposit />
      case 'stake':
        return <BridgeStake />
      case 'withdraw':
        return <BridgeWithdraw />
      case 'connect':
        return <BridgeConnect />
      default:
        return null
    }
  }

  useEffect(() => {
    if (isConnected && activeTabId === 'connect') {
      setActiveTabId('deposit')
    } else if (!isConnected && activeTabId !== 'connect') {
      setActiveTabId('connect')
    }
  }, [isConnected, activeTabId])

  useEffect(() => {
    if (isConnected) {
      setCurrentProgress(1)
    }
  }, [isConnected])

  return (
    <div className="w-full min-h-screen relative overflow-hidden flex flex-col justify-center py-32">
      <div className="container">
        <div className="flex flex-col items-center">
          <section className="md:max-w-[62.919rem] w-full flex md:flex-row flex-col-reverse text-[1rem] text-white ">
            <div className="md:max-w-[30.95rem] w-full flex flex-col md:pt-10">
              <div className="bg-black font-ocr-x-trial  border-white border-[.075rem] border-dashed flex flex-col md:pt-[2.562rem] md:pb-[2.25rem] md:pl-[2.5rem] md:pr-[0.5rem] px-4 py-6 md:gap-[2.375rem] gap-6 md:min-h-[44.6875rem]">
                <div className="relative tracking-[-0.06em] leading-[1.313rem] font-maison-neue-trial">
                  ## HOW IT WORKS
                </div>
                <div className="flex flex-col gap-10 max-w-[27rem] flex-1">
                  <div className="flex flex-col gap-[2.375rem]">
                    <div className="flex flex-col gap-4">
                      <div>
                        <span>[ Step 1 | </span>
                        <span className="text-fuchsia">CONNECT WALLET</span>
                        <span> ] </span>
                      </div>
                      <div className="tracking-[-0.06em] leading-[1.313rem] font-maison-neue-trial">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia
                        odio vitae vestibulum vestibulum cras venenatis.
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div>
                        <span>[ Step 2 | </span>
                        <span className="text-fuchsia">BRIDGE</span>
                        <span> ] </span>
                      </div>
                      <div className="tracking-[-0.06em] leading-[1.313rem] font-maison-neue-trial">
                        <p className="m-0">/ Bridge your WBTC to LBTC</p>
                        <p className="m-0">/ Wrap their WBTC to receive LBTC</p>
                        <p className="m-0">/ Bridge their LBTC to Bitlazer’s Arbitrum L3</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div>
                        <span>[ Step 3 | </span>
                        <span className="text-fuchsia">STAKE</span>
                        <span> ] </span>
                      </div>
                      <div className="tracking-[-0.06em] leading-[1.313rem] font-maison-neue-trial">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia
                        odio vitae vestibulum vestibulum cras venenatis.
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div>
                        <span>[ Step 3 | </span>
                        <span className="uppercase text-fuchsia">Earn yield</span>
                        <span> ] </span>
                      </div>
                      <div className="tracking-[-0.06em] leading-[1.313rem] font-maison-neue-trial">
                        / Earn yield in LBTC and LZR tokens
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-[0.312rem] mt-auto overflow-hidden">
                    <div className="relative inline-flex flex-row max-w-full text-base font-normal  font-arial ">
                      <div className={currentProgress > 0 ? 'text-[#66d560]' : ''}>░░░░░░░░░░░</div>
                      <div className={currentProgress > 1 ? 'text-[#66d560]' : ''}>░░░░░░░░░░░</div>
                      <div className={currentProgress > 2 ? 'text-[#66d560]' : ''}>░░░░░░░░░░░</div>
                    </div>
                    <div className="tracking-[-0.06em] leading-[1.25rem] font-maison-neue-trial">
                      CURRENT PROGRESS{' '}
                      <span className="font-ocr-x-trial">
                        {currentProgress}/3 <span className="font-maison-neue-trial">[</span>{' '}
                        {Math.round((currentProgress / 3) * 100)}%{' '}
                        <span className="font-maison-neue-trial">]</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:max-w-[31.75rem] w-full flex flex-col">
              <div className="grid grid-cols-3 relative z-10">
                {tabs.map(
                  (tab) =>
                    tab.id !== 'connect' && (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTabId(tab.id)}
                        className={clsx(
                          'font-ocr-x-trial w-full cursor-pointer rounded-[.115rem] h-10 text-lightgreen-100 text-[1.25rem] whitespace-nowrap flex py-[0.187rem] px-[0.125rem] transition-all duration-300 group',
                          activeTabId === tab.id
                            ? 'bg-forestgreen pointer-events-none touch-none'
                            : 'bg-darkslategray-200',
                        )}
                      >
                        <span
                          className={clsx(
                            'px-[0.875rem] h-full shadow-[-1.8px_-0.9px_3.69px_rgba(215,_215,_215,_0.18)_inset,_1.8px_1.8px_1.84px_rgba(0,_0,_0,_0.91)_inset] rounded-[.115rem] flex items-center justify-center text-center transition-all duration-300 w-full',
                            activeTabId === tab.id
                              ? 'bg-darkolivegreen-200'
                              : 'bg-black group-hover:bg-dimgray-200',
                          )}
                        >
                          {tab.name}
                        </span>
                      </button>
                    ),
                )}
              </div>

              <div className="w-full bg-black border-forestgreen border-[.1875rem] border-solid flex flex-col md:py-[2.625rem] md:px-[2.5rem] px-4 py-6 flex-1">
                {renderContent()}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Bridge
