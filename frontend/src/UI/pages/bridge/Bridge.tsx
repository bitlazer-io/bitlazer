import React, { FC, useState } from 'react'
import BridgeDeposit from './deposit/BridgeDeposit'
import BridgeStake from './stake/BridgeStake'
import BridgeWithdraw from './withdraw/BridgeWithdraw'

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
  ]

  const [activeTabId, setActiveTabId] = useState<string>('deposit')

  const renderContent = () => {
    switch (activeTabId) {
      case 'deposit':
        return <BridgeDeposit />
      case 'stake':
        return <BridgeStake />
      case 'withdraw':
        return <BridgeWithdraw />
      default:
        return null
    }
  }

  return (
    <div className="w-full min-h-screen relative overflow-hidden flex flex-col justify-center py-32">
      <div className="container">
        <div className="flex flex-col items-center">
          <section className="md:max-w-[62.919rem] w-full flex md:flex-row flex-col-reverse text-[1rem] text-white ">
            <div className="md:max-w-[30.95rem] w-full flex flex-col md:pt-10">
              <div className="bg-black font-ocr-x-trial  border-white border-[.075rem] border-dashed flex flex-col md:pt-[2.562rem] md:pb-[2.25rem] md:pl-[2.5rem] md:pr-[0.5rem] px-4 py-6 md:gap-[2.375rem] gap-6 md:min-h-[44.6875rem]">
                <div className="relative tracking-[-0.06em] leading-[1.313rem]">
                  ## HOW IT WORKS
                </div>
                <div className="flex flex-col gap-10 max-w-[25.8125rem] flex-1">
                  <div className="flex flex-col gap-[2.375rem]">
                    <div className="flex flex-col gap-4">
                      <div>
                        <span>[ Step 1 | </span>
                        <span className="text-fuchsia">CONNECT WALLET</span>
                        <span> ] </span>
                      </div>
                      <div className="tracking-[-0.06em] leading-[1.313rem] ">
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
                      <div className="tracking-[-0.06em] leading-[1.313rem] ">
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
                      <div className="tracking-[-0.06em] leading-[1.313rem] ">
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
                      <div className="tracking-[-0.06em] leading-[1.313rem] ">
                        / Earn yield in LBTC and LZR tokens
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-[0.312rem] font-arial mt-auto overflow-hidden">
                    <div className="relative inline-block max-w-full">
                      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
                    </div>
                    <div className="tracking-[-0.06em] leading-[1.25rem] ">
                      CURRENT PROGRESS 0/2 [ 0% ]
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:max-w-[31.75rem] w-full flex flex-col gap-[0.5px]">
              <div className="grid grid-cols-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    className={`font-ocr-x-trial w-full cursor-pointer rounded-[.115rem] h-10 text-lightgreen-100 text-[1.25rem] whitespace-nowrap flex py-[0.187rem] px-[0.125rem] transition-all duration-300 group ${
                      activeTabId === tab.id
                        ? 'bg-forestgreen pointer-events-none touch-none'
                        : 'bg-darkslategray-200'
                    }`}
                  >
                    <span
                      className={`px-[0.875rem] h-full shadow-[-1.8px_-0.9px_3.69px_rgba(215,_215,_215,_0.18)_inset,_1.8px_1.8px_1.84px_rgba(0,_0,_0,_0.91)_inset] rounded-[.115rem] flex items-center justify-center text-center transition-all duration-300 w-full ${
                        activeTabId === tab.id
                          ? 'bg-darkolivegreen-200'
                          : 'bg-black group-hover:bg-dimgray-200'
                      }`}
                    >
                      {tab.name}
                    </span>
                  </button>
                ))}
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