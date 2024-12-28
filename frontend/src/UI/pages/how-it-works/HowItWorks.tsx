/* eslint-disable react/no-unescaped-entities */
import React, { FC, useEffect, useState } from 'react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'

interface IHowItWorks {}

const HowItWorks: FC<IHowItWorks> = () => {
  const [maxHeight, setMaxHeight] = useState('40rem')

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 991.98) {
        setMaxHeight('94.7vh')
      } else {
        setMaxHeight('40rem')
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex-1 rounded-12xs bg-black font-ocrx border-forestgreen border-[.1875rem] border-solid box-border flex flex-col md:max-h-[40rem]">
      <OverlayScrollbarsComponent options={{}} style={{ maxHeight, overflow: 'auto' }}>
        <div className="flex flex-col gap-[1.668rem]">
          <div className="flex flex-col gap-6 md:gap-[2.375rem] md:p-10 px-4 py-6 text-2xl">
            <div className="tracking-[-0.06em] leading-[1.313rem] text-2xl">## HOW IT WORKS</div>
            <div className="flex flex-col gap-[2.375rem]">
              <div className="flex flex-col gap-4">
                <div className="text-2xl">
                  <span>[ Step 1 | </span>
                  <span className="text-fuchsia">Convert WBTC to lzrBTC</span>
                  <span> ] </span>
                </div>
                <div className="tracking-[-0.06em] leading-[1.313rem] ">
                  Easily convert your Wrapped Bitcoin (WBTC) to lzrBTC with minimal fees and lightning-fast speed.
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="text-2xl">
                  <span>[ Step 2 | </span>
                  <span className="text-fuchsia">Bridge lzrBTC to Bitlazer </span>
                  <span> ] </span>
                </div>
                <div className="tracking-[-0.06em] leading-[1.313rem] ">
                  <p className="m-0">
                    Securely bridge your lzrBTC from Ethereum to Bitlazer's cutting-edge Arbitrum L3 in just a few
                    clicks.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="text-2xl">
                  <span>[ Step 3 | </span>
                  <span className="text-fuchsia">Stake and Earn Yield </span>
                  <span> ] </span>
                </div>
                <div className="tracking-[-0.06em] leading-[1.313rem] ">
                  <p className="m-0">
                    Seamlessly stake your lzrBTC to earn native Bitcoin gas fee rewards and LZR tokens, alongside all
                    other incentives.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="text-2xl">
                  <span>[ Step 4 | </span>
                  <span className="text-fuchsia">Unstake and Collet Rewards </span>
                  <span> ] </span>
                </div>
                <div className="tracking-[-0.06em] leading-[1.313rem] ">
                  <p className="m-0">
                    Easily unstake and unwrap your lzrBTC and instantly claim your earned rewards. Enjoy complete
                    flexibility with immediate access to Bitcoin gas payouts, LZR tokens, and all accrued benefits, on
                    your terms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </OverlayScrollbarsComponent>
    </div>
  )
}

export default HowItWorks
