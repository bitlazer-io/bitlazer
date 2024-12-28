/* eslint-disable react/no-unescaped-entities */
import React, { FC, useEffect, useState } from 'react'

import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'

import img1 from '../../../assets/images/group-1364.svg'
import img2 from '../../../assets/images/group-1365.svg'
import img3 from '../../../assets/images/group-1366.svg'
import img4 from '../../../assets/images/group-1367.svg'

interface IFeatures {}

const Features: FC<IFeatures> = () => {
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
        <ul>
          <li className="flex flex-col md:p-10 md:pl-20 px-4 py-6 border-forestgreen border-0 border-b-[.1875rem] border-solid last:!border-0">
            <div className="flex md:flex-row flex-col items-center gap-6 md:gap-[4.187rem]">
              <div className="md:h-[11.588rem] md:w-[10.763rem] h-[8rem] w-[8rem] flex-shrink-0">
                <img className="w-full h-full object-contain" loading="lazy" alt="" src={img4} />
              </div>
              <div className="flex-1 flex flex-col gap-4 pr-4">
                <div className="uppercase text-xl md:text-[1.5rem]">Native BTC Yield</div>
                <div className="text-base tracking-[-0.06em] leading-[1.313rem] font-maison-neue">
                  Users can stake their L3 Bitcoin and earn dual staking rewards. Yield is generated from the network's
                  activity and gas fees that are directed to stakers, offering an incentive to hold Bitcoin within the
                  Bitlazer ecosystem, while expanding earning potential.
                </div>
              </div>
            </div>
          </li>

          <li className="flex flex-col md:p-10 md:pl-20 px-4 py-6 border-forestgreen border-0 border-b-[.1875rem] border-solid last:!border-0">
            <div className="flex md:flex-row flex-col items-center gap-6 md:gap-[4.187rem]">
              <div className="md:h-[11.588rem] md:w-[10.763rem] h-[8rem] w-[8rem] flex-shrink-0">
                <img className="w-full h-full object-contain" loading="lazy" alt="" src={img2} />
              </div>
              <div className="flex-1 flex flex-col gap-4 pr-4">
                <div className="uppercase text-xl md:text-[1.5rem]">Seamless Bridging</div>
                <div className="text-base tracking-[-0.06em] leading-[1.313rem] font-maison-neue">
                  Users can seamlessly transfer WBTC or EVM-compatible BTC into Bitlazer's Layer 3, enabling secure,
                  efficient interactions while optimizing cross-chain operations and unlocking greater yield potential
                  for their Bitcoin.
                </div>
              </div>
            </div>
          </li>
          <li className="flex flex-col md:p-10 md:pl-20 px-4 py-6 border-forestgreen border-0 border-b-[.1875rem] border-solid last:!border-0">
            <div className="flex md:flex-row flex-col items-center gap-6 md:gap-[4.187rem]">
              <div className="md:h-[11.588rem] md:w-[10.763rem] h-[8rem] w-[8rem] flex-shrink-0">
                <img className="w-full h-full object-contain" loading="lazy" alt="" src={img3} />
              </div>
              <div className="flex-1 flex flex-col gap-4 pr-4">
                <div className="uppercase text-xl md:text-[1.5rem]">Fast Settlements</div>
                <div className="text-base tracking-[-0.06em] leading-[1.313rem] font-maison-neue">
                  With Bitlazer's L3, users experience lightning-fast settlements. This speed ensures efficient staking,
                  withdrawals and cross-chain interactions, creating a smooth and responsive user experience.
                </div>
              </div>
            </div>
          </li>
          <li className="flex flex-col md:p-10 md:pl-20 px-4 py-6 border-forestgreen border-0 border-b-[.1875rem] border-solid last:!border-0">
            <div className="flex md:flex-row flex-col items-center gap-6 md:gap-[4.187rem]">
              <div className="md:h-[11.588rem] md:w-[10.763rem] h-[8rem] w-[8rem] flex-shrink-0">
                <img className="w-full h-full object-contain" loading="lazy" alt="" src={img1} />
              </div>
              <div className="flex-1 flex flex-col gap-4 pr-4">
                <div className="uppercase text-xl md:text-[1.5rem]">Low Fees</div>
                <div className="text-base tracking-[-0.06em] leading-[1.313rem] font-maison-neue">
                  Bitlazer's L3 infrastructure ensures transaction fees always remaim below a cent, enabling
                  cost-efficient interactions with the technology and seamless utility across the ecosystem.
                </div>
              </div>
            </div>
          </li>
        </ul>
      </OverlayScrollbarsComponent>
    </div>
  )
}

export default Features
