import React, { FC, useState } from 'react'

import MyModal from '@components/modal/MyModal'
import HowItWorks from '@pages/how-it-works/HowItWorks'
import ConnectWallet from '@pages/connect-wallet/ConnectWallet'
import Roadmap from '@pages/roadmap/Roadmap'
import Features from '@pages/features/Features'

interface IFooter {}

const Footer: FC<IFooter> = () => {
  const [openHowItWorksModal, setOpenHowItWorksModal] = useState(false)
  const [openConnectWalletModal, setOpenConnectWalletModal] = useState(false)
  const [openRoadmapModal, setOpenRoadmapModal] = useState(false)
  const [openFeaturesModal, setOpenFeaturesModal] = useState(false)

  return (
    <footer className="absolute bottom-0 left-0 w-full text-xl text-gray-100 font-ocrx z-30 md:pointer-events-auto md:[&_*]:pointer-events-auto">
      <div className="container">
        <div className="flex md:flex-row flex-col items-center justify-between gap-5 border-dimgray-100 border-0 border-t-[.075rem] border-dashed pt-5 pb-[1.625rem] ">
          <nav className="tracking-[-0.02em]">
            <ul className="flex items-center gap-5">
              {/* <li>
                <Link className="text-gray-100 hover:text-white" to="/about">
                  ABOUT
                </Link>
              </li> */}
              <li>
                <a
                  className="hover:scale-105 hover:line-through inline-block"
                  href="https://bitlazer.gitbook.io/bitlazer"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  DOCUMENTATION
                </a>
              </li>
              |
              <li>
                <a
                  className="hover:scale-105 hover:line-through inline-block"
                  href="https://explorer.testnet.bitlazer.io"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  EXPLORER
                </a>
              </li>
              |
              <li>
                <a
                  className="hover:scale-105 hover:line-through inline-block"
                  href="https://faucet.testnet.bitlazer.io"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  TESTNET FAUCET
                </a>
              </li>
            </ul>
          </nav>
          <ul className="flex items-center gap-5 tracking-[-0.02em]">
            <li>
              <a
                className="text-gray-100 hover:scale-105 hover:line-through inline-block"
                href="https://x.com/bitlazer"
                target="_blank"
                rel="noopener noreferrer"
              >
                TWITTER
              </a>
            </li>
            <li>
              <a
                className="text-gray-100 hover:scale-105 hover:line-through inline-block"
                href="https://t.me/bitlazer_io"
                target="_blank"
                rel="noopener noreferrer"
              >
                TELEGRAM
              </a>
            </li>
          </ul>
        </div>
      </div>
      <MyModal
        label={'HOW IT WORKS'}
        width="md:w-[39.375rem]"
        position="md:top-1/2 md:left-1/4 md:-translate-x-1/4 md:-translate-y-1/2"
        open={openHowItWorksModal}
        handleClose={() => setOpenHowItWorksModal(false)}
      >
        <HowItWorks />
      </MyModal>
      <MyModal
        label={'CONNECT WALLET'}
        width="md:w-[21.4375rem]"
        open={openConnectWalletModal}
        handleClose={() => setOpenConnectWalletModal(false)}
      >
        <ConnectWallet />
      </MyModal>
      <MyModal
        label={'ROADMAP'}
        width="md:w-[41.375rem]"
        position="md:top-1/4 md:left-2/3 md:-translate-x-1/2 md:-translate-y-1/4"
        open={openRoadmapModal}
        handleClose={() => setOpenRoadmapModal(false)}
      >
        <Roadmap />
      </MyModal>
      <MyModal
        label={'KEY FEATURES'}
        width="md:w-[50rem]"
        open={openFeaturesModal}
        handleClose={() => setOpenFeaturesModal(false)}
      >
        <Features />
      </MyModal>
    </footer>
  )
}

export default Footer
