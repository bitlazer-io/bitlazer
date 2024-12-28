/* eslint-disable react/no-unescaped-entities */
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
          <div className="flex flex-col gap-6 md:gap-[2.375rem] md:p-10 px-4 py-6 text-2xl">
            <div className="tracking-[-0.06em] leading-[1.313rem] text-2xl">## WHERE THIS IS GOING</div>
            <div className="flex flex-col gap-[2.375rem]">
              <div className="flex flex-col gap-4">
                <div>
                  <span>[ Stage 1 | </span>
                  <span className="text-fuchsia uppercase">Initial Launch and Bridging</span>
                  <span> ] </span>
                </div>
                <div className="tracking-[-0.06em] leading-[1.313rem] max-w-[29.5rem]">
                  <p className="m-0">
                    Launch the bridging of Wrapped Bitcoin (WBTC) as well as the staking on Bitlazer's L3 network for
                    Bitcoin and LZR rewards.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <span>[ Stage 2 | </span>
                  <span className="text-fuchsia uppercase">Ecosystem Bootstrap with LZR Grant Program</span>
                  <span> ] </span>
                </div>
                <div className="tracking-[-0.06em] leading-[1.313rem] max-w-[29.5rem]">
                  <p className="m-0">
                    Kickstart community growth by distributing 20% of LZR tokens to early builders. Empower innovators
                    and reward active contributors who shape the future of the Bitlazer ecosystem.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <span>[ Stage 3 | </span>
                  <span className="text-fuchsia uppercase">Native BTC Bridge via Light Client</span>
                  <span> ] </span>
                </div>
                <div className="tracking-[-0.06em] leading-[1.313rem] max-w-[29.5rem]">
                  <p className="m-0">
                    Introduce the native BTC bridge powered by Stylus smart contracts and light client technology. This
                    integration ensures secure, trustless, and highly efficient Bitcoin transfers, offering unparalleled
                    scalability, reduced transaction latency, and enhanced network reliability.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <span>[ Stage 4 | </span>
                  <span className="uppercase text-fuchsia">Native Sequencing and Withdrawal Optimization</span>
                  <span> ] </span>
                </div>
                <div className="tracking-[-0.06em] leading-[1.313rem] max-w-[29.5rem]">
                  <p className="m-0">
                    Advanced algorithms for native transaction sequencing and withdrawal processing. This enhancement
                    minimizes latency, reduces onchain congestion, and provides Bitlazer users with seamless, secure,
                    and highly efficient interactions across the whole ecosystem.
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
