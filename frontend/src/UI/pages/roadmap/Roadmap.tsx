import React, { FC, useEffect, useState } from 'react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'

interface IRoadmap {}

const Roadmap: FC<IRoadmap> = () => {
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
    <div className="flex-1  rounded-12xs bg-black font-ocrx border-forestgreen border-[.1875rem] border-solid box-border flex flex-col md:max-h-[40rem]">
      <OverlayScrollbarsComponent options={{}} style={{ maxHeight, overflow: 'auto' }}>
        <div className="flex flex-col gap-[1.668rem]">
          <div className="flex flex-col gap-6 md:gap-[2.375rem] md:p-10 px-4 py-6 ">
            <div className="tracking-[-0.06em] leading-[1.313rem] text-2xl">## WHERE THIS IS GOING</div>
            <div className="flex flex-col gap-[2.375rem]">
              <div className="flex flex-col gap-4">
                <div>
                  <span>[ Stage 1 | </span>
                  <span className="text-fuchsia uppercase">Launch and Bridging</span>
                  <span> ] </span>
                </div>
                <div className="tracking-[-0.06em] leading-[1.313rem] max-w-[29.5rem]">
                  <p className="m-0">/ Bitlazer launch, enabling the bridging of WBTC to Arbitrum L3.</p>
                  <p className="m-0">/ Staking and yield enabled.</p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <span>[ Stage 2 | </span>
                  <span className="text-fuchsia uppercase">Ecosystem Bootstrap with LZR Airdrop</span>
                  <span> ] </span>
                </div>
                <div className="tracking-[-0.06em] leading-[1.313rem] max-w-[29.5rem]">
                  <p className="m-0">/ Conduct an airdrop of 20% of LZR tokens to early community builders.</p>
                  <p className="m-0">
                    / Encourage the creation of decentralized applications (dApps) and innovative projects on the
                    platform.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <span>[ Stage 3 | </span>
                  <span className="text-fuchsia uppercase">STAKE</span>
                  <span> ] </span>
                </div>
                <div className="tracking-[-0.06em] leading-[1.313rem] max-w-[29.5rem]">
                  <p className="m-0">
                    / Implement a native BTC bridge using a light client with Stylus smart contracts on Arbitrum.
                  </p>
                  <p className="m-0">
                    / Facilitate seamless transfers and interactions with native BTC within the Bitlazer ecosystem.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <span>[ Stage 4 | </span>
                  <span className="uppercase text-fuchsia">Earn yield</span>
                  <span> ] </span>
                </div>
                <div className="tracking-[-0.06em] leading-[1.313rem] max-w-[29.5rem]">
                  <p className="m-0">/ Optimize transaction sequencing and withdrawal processing.</p>
                  <p className="m-0">
                    / Enable native sequencing of L3 roll-up payloads and withdrawals, ensuring secure handling of
                    native BTC requests.
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

export default Roadmap
