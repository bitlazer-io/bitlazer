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
    <div className="flex-1  rounded-12xs bg-black font-ocr-x-trial border-forestgreen border-[.1875rem] border-solid box-border flex flex-col md:max-h-[40rem]">
      <OverlayScrollbarsComponent options={{}} style={{ maxHeight, overflow: 'auto' }}>
        <div className="flex flex-col gap-[1.668rem]">
          <div className="flex flex-col gap-6 md:gap-[2.375rem] md:p-10 px-4 py-6 ">
            <div className="tracking-[-0.06em] leading-[1.313rem]">## HOW IT WORKS</div>
            <div className="flex flex-col gap-[2.375rem]">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4">
                  <span>[ Stage 1 ] </span>
                  <span className="text-fuchsia uppercase">
                    Users wrap their WBTC to receive LBTC
                  </span>
                </div>
                <div className="tracking-[-0.06em] leading-[1.313rem] max-w-[29.5rem]">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio
                  vitae vestibulum vestibulum. Cras venenatis euismod malesuada. Sed sit amet sapien
                  eget magna dapibus tincidunt. Pellentesque habitant morbi tristique senectus et
                  netus et malesuada fames ac turpis egestas.
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4">
                  <span>[ Stage 2 ] </span>
                  <span className="text-fuchsia uppercase">
                    Users bridge their LBTC to Bitlazer’s Arbitrum L3
                  </span>
                </div>
                <div className="tracking-[-0.06em] leading-[1.313rem] max-w-[29.5rem]">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio
                  vitae vestibulum vestibulum. Cras venenatis euismod malesuada. Sed sit amet sapien
                  eget magna dapibus tincidunt. Pellentesque habitant morbi tristique senectus et
                  netus et malesuada fames ac turpis egestas.
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4">
                  <span>[ Stage 3 ] </span>
                  <span className="text-fuchsia uppercase">
                    User’s stake their LBTC and earn LBTC alongside LZR tokens
                  </span>
                </div>
                <div className="tracking-[-0.06em] leading-[1.313rem] max-w-[29.5rem]">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio
                  vitae vestibulum vestibulum. Cras venenatis euismod malesuada. Sed sit amet sapien
                  eget magna dapibus tincidunt. Pellentesque habitant morbi tristique senectus et
                  netus et malesuada fames ac turpis egestas.
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
