import React, { FC, useState, useEffect } from 'react'
import logo from '../../../assets/images/logowhite.svg'
import burger from '../../../assets/images/burger.jpeg'
import { Link, useLocation } from 'react-router-dom'
import Button from '@components/button/Button'
import MyModal from '@components/modal/MyModal'
import HowItWorks from '@pages/how-it-works/HowItWorks'
import ConnectWallet from '@pages/connect-wallet/ConnectWallet'
import Roadmap from '@pages/roadmap/Roadmap'
import Features from '@pages/features/Features'
import clsx from 'clsx'
import { useAccount } from 'wagmi'
import { Account } from '@pages/connect-wallet/Account'
import { devnet } from 'src/web3/chains'
import { config } from 'src/web3/config'
import { switchChain } from '@wagmi/core'

interface IHeader {}

const Header: FC<IHeader> = () => {
  const [isActive, setIsActive] = useState(false)
  const [openHowItWorksModal, setOpenHowItWorksModal] = useState(false)
  const [openConnectWalletModal, setOpenConnectWalletModal] = useState(false)
  const [openRoadmapModal, setOpenRoadmapModal] = useState(false)
  const [openFeaturesModal, setOpenFeaturesModal] = useState(false)
  const { isConnected, chainId } = useAccount()

  const location = useLocation()

  const toggleMenu = () => {
    setIsActive(!isActive)
  }

  const closeMenu = () => {
    setIsActive(false)
  }

  // Close modals when the location changes
  useEffect(() => {
    setOpenHowItWorksModal(false)
    setOpenConnectWalletModal(false)
    setOpenRoadmapModal(false)
    setOpenFeaturesModal(false)
  }, [location])

  useEffect(() => {
    if (isConnected) {
      setOpenConnectWalletModal(false)
    }
  }, [isConnected])

  useEffect(() => {
    const _switchChain = async () => {
      await switchChain(config, { chainId: devnet.id })
    }
    if (chainId && chainId !== devnet.id) {
      _switchChain()
    }
  }, [chainId])

  return (
    <>
      <header className="w-full fixed md:absolute top-0 left-0 z-50 bg-black md:bg-transparent">
        <div className="container">
          <div className="flex flex-row items-center justify-between gap-4">
            <Link
              to={'/'}
              className="h-[5.625rem] w-[9.606rem] flex items-center justify-center flex-shrink-0"
            >
              <img className="w-full h-full object-contain" loading="lazy" alt="" src={logo} />
            </Link>
            <button
              id="burger"
              onClick={toggleMenu}
              className="w-12 h-12 -mr-2 flex-col justify-center items-center gap-[.3125rem] inline-flex flex-shrink-0 block md:hidden ml-auto"
            >
              <img className="w-full h-full object-contain" src={burger} alt="" />
            </button>
            <div
              className={`flex h-screen flex-col text-white fixed  md:flex-1 transition-all md:p-0 px-4 py-8 pt-24 duration-300 z-[100] bg-black w-full top-0 overflow-y-auto md:overflow-visible md:top-auto md:w-auto md:h-auto md:bg-transparent md:static md:z-auto ${
                isActive ? 'right-0' : '-right-[100vw]'
              }`}
            >
              <button
                onClick={closeMenu}
                className="md:hidden absolute top-4 right-4 z-10 h-[2.025rem] w-[1.881rem] text-lightgreen-100 hover:text-lightgreen-100 rounded-[.115rem] bg-darkolivegreen-200 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-[1.8px_1.8px_1.84px_1.4px_rgba(0,_0,_0,_0.91)_inset]"
              >
                X
              </button>
              <div className="items-center gap-[4.875rem] flex md:flex-row flex-col">
                <nav className="whitespace-nowrap text-[1.25rem] text-lightgreen-100 font-ocr-x-trial md:mx-auto">
                  <ul className="flex md:flex-row flex-col items-center gap-8">
                    <li>
                      <button
                        className={clsx(
                          'text-lightgreen-100 hover:opacity-80',
                          openHowItWorksModal && 'line-through select-none',
                        )}
                        onClick={() => {
                          setOpenHowItWorksModal(!openHowItWorksModal)
                          closeMenu()
                        }}
                      >
                        [HOW IT WORKS]
                      </button>
                    </li>
                    <li>
                      <Link
                        to="/about"
                        className={`text-lightgreen-100 hover:opacity-80 ${location.pathname === '/about' ? 'line-through pointer-events-none' : ''}`}
                        onClick={closeMenu}
                      >
                        [ABOUT]
                      </Link>
                    </li>
                    <li>
                      <button
                        className={clsx(
                          'text-lightgreen-100 hover:opacity-80',
                          openFeaturesModal && 'line-through select-none',
                        )}
                        onClick={() => {
                          setOpenFeaturesModal(!openFeaturesModal)
                          closeMenu()
                        }}
                      >
                        [FEATURES]
                      </button>
                    </li>
                    <li>
                      <Link
                        to="/bridge"
                        className={`text-lightgreen-100 hover:opacity-80 ${location.pathname === '/bridge' ? 'line-through pointer-events-none' : ''}`}
                        onClick={closeMenu}
                      >
                        [BRIDGE]
                      </Link>
                    </li>
                    <li>
                      <button
                        className={clsx(
                          'text-lightgreen-100 hover:opacity-80',
                          openRoadmapModal && 'line-through select-none',
                        )}
                        onClick={() => {
                          setOpenRoadmapModal(!openRoadmapModal)
                          closeMenu()
                        }}
                      >
                        [ROADMAP]
                      </button>
                    </li>
                    <li>
                      <Link
                        to="/faq"
                        className={`text-lightgreen-100 hover:opacity-80 ${location.pathname === '/faq' ? 'line-through pointer-events-none' : ''}`}
                        onClick={closeMenu}
                      >
                        [FAQ]
                      </Link>
                    </li>
                  </ul>
                </nav>
                <Button
                  onClick={() => {
                    if (!isConnected) {
                      setOpenConnectWalletModal(!openConnectWalletModal)
                      closeMenu()
                    }
                  }}
                  className="!w-auto"
                >
                  {isConnected ? <Account /> : 'CONNECT WALLET'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <MyModal
        label={'HOW IT WORKS'}
        width="md:w-[39.375rem]"
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
    </>
  )
}

export default Header
