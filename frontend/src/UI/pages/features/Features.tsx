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
    <div className="flex-1  rounded-12xs bg-black font-ocr-x-trial border-forestgreen border-[.1875rem] border-solid box-border flex flex-col md:max-h-[40rem]">
      <OverlayScrollbarsComponent options={{}} style={{ maxHeight, overflow: 'auto' }}>
        <ul>
          <li className="flex flex-col md:p-10 md:pl-20 px-4 py-6 border-forestgreen border-0 border-b-[.1875rem] border-solid last:!border-0">
            <div className="flex md:flex-row flex-col items-center gap-6 md:gap-[4.187rem]">
              <div className="md:h-[11.588rem] md:w-[10.763rem] h-[8rem] w-[8rem] flex-shrink-0">
                <img className="w-full h-full object-contain" loading="lazy" alt="" src={img1} />
              </div>
              <div className="flex-1 flex flex-col gap-4">
                <div className="uppercase text-xl">Native BTC Yield</div>
                <div className="text-base tracking-[-0.06em] leading-[1.313rem] font-maison-neue-trial">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio
                  vitae vestibulum vestibulum. Cras venenatis euismod malesuada. Sed sit amet sapien
                  eget magna dapibus tincidunt. Pellentesque habitant morbi tristique senectus et
                  netus et malesuada fames ac turpis egestas.
                </div>
              </div>
            </div>
          </li>
          <li className="flex flex-col md:p-10 md:pl-20 px-4 py-6 border-forestgreen border-0 border-b-[.1875rem] border-solid last:!border-0">
            <div className="flex md:flex-row flex-col items-center gap-6 md:gap-[4.187rem]">
              <div className="md:h-[11.588rem] md:w-[10.763rem] h-[8rem] w-[8rem] flex-shrink-0">
                <img className="w-full h-full object-contain" loading="lazy" alt="" src={img2} />
              </div>
              <div className="flex-1 flex flex-col gap-4">
                <div className="uppercase text-xl">Seamless Bridging</div>
                <div className="text-base tracking-[-0.06em] leading-[1.313rem] font-maison-neue-trial">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio
                  vitae vestibulum vestibulum. Cras venenatis euismod malesuada. Sed sit amet sapien
                  eget magna dapibus tincidunt. Pellentesque habitant morbi tristique senectus et
                  netus et malesuada fames ac turpis egestas.
                </div>
              </div>
            </div>
          </li>
          <li className="flex flex-col md:p-10 md:pl-20 px-4 py-6 border-forestgreen border-0 border-b-[.1875rem] border-solid last:!border-0">
            <div className="flex md:flex-row flex-col items-center gap-6 md:gap-[4.187rem]">
              <div className="md:h-[11.588rem] md:w-[10.763rem] h-[8rem] w-[8rem] flex-shrink-0">
                <img className="w-full h-full object-contain" loading="lazy" alt="" src={img3} />
              </div>
              <div className="flex-1 flex flex-col gap-4">
                <div className="uppercase text-xl">Fast Settlements</div>
                <div className="text-base tracking-[-0.06em] leading-[1.313rem] font-maison-neue-trial">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio
                  vitae vestibulum vestibulum. Cras venenatis euismod malesuada. Sed sit amet sapien
                  eget magna dapibus tincidunt. Pellentesque habitant morbi tristique senectus et
                  netus et malesuada fames ac turpis egestas.
                </div>
              </div>
            </div>
          </li>
          <li className="flex flex-col md:p-10 md:pl-20 px-4 py-6 border-forestgreen border-0 border-b-[.1875rem] border-solid last:!border-0">
            <div className="flex md:flex-row flex-col items-center gap-6 md:gap-[4.187rem]">
              <div className="md:h-[11.588rem] md:w-[10.763rem] h-[8rem] w-[8rem] flex-shrink-0">
                <img className="w-full h-full object-contain" loading="lazy" alt="" src={img4} />
              </div>
              <div className="flex-1 flex flex-col gap-4">
                <div className="uppercase text-xl">low fees</div>
                <div className="text-base tracking-[-0.06em] leading-[1.313rem] font-maison-neue-trial">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio
                  vitae vestibulum vestibulum. Cras venenatis euismod malesuada. Sed sit amet sapien
                  eget magna dapibus tincidunt. Pellentesque habitant morbi tristique senectus et
                  netus et malesuada fames ac turpis egestas.
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
