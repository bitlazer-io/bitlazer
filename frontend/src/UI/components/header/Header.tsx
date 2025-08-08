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
import { useAccount, useBalance } from 'wagmi'
import { Account } from '@pages/connect-wallet/Account'
import { arbitrum } from 'wagmi/chains'
import { mainnet } from 'src/web3/chains'
import { ERC20_CONTRACT_ADDRESS } from 'src/web3/contracts'
import { formatEther } from 'viem'

interface IHeader { }

const Header: FC<IHeader> = () => {
  const [isActive, setIsActive] = useState(false)
  const [openHowItWorksModal, setOpenHowItWorksModal] = useState(false)
  const [openConnectWalletModal, setOpenConnectWalletModal] = useState(false)
  const [openRoadmapModal, setOpenRoadmapModal] = useState(false)
  const [openFeaturesModal, setOpenFeaturesModal] = useState(false)
  const [refresh, setRefresh] = useState(false)
  const [showArbitrum, setShowArbitrum] = useState(true)
  const { address, isConnected } = useAccount()

  const location = useLocation()

  const formatBalance = (balance: string) => {
    if (!balance) return '0'
    const etherValue = formatEther(BigInt(balance))
    // Use string manipulation to avoid rounding - just truncate after 8 decimals
    const parts = etherValue.split('.')
    if (parts.length === 1) return parts[0] // No decimals
    // Take up to 8 decimal places without rounding
    const decimals = parts[1].substring(0, 8)
    // Remove trailing zeros for cleaner display
    const trimmedDecimals = decimals.replace(/0+$/, '')
    return trimmedDecimals ? `${parts[0]}.${trimmedDecimals}` : parts[0]
  }

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

  // lzrBTC balance on Arbitrum
  const {
    data: arbitrumData,
    isLoading: arbitrumLoading,
    refetch: refetchArbitrum,
  } = useBalance({
    address,
    token: ERC20_CONTRACT_ADDRESS['lzrBTC'],
    chainId: arbitrum.id,
    scopeKey: refresh.toString(),
  })

  // Native lzrBTC balance on Bitlazer L3
  const {
    data: bitlazerData,
    isLoading: bitlazerLoading,
    refetch: refetchBitlazer,
  } = useBalance({
    address,
    chainId: mainnet.id,
    scopeKey: refresh.toString(),
  })

  // Refresh balances every 5 seconds when connected
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        setRefresh(prev => !prev)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [isConnected])

  return (
    <>
      <header className="w-full fixed md:absolute top-0 left-0 z-50 bg-black md:bg-transparent md:pointer-events-auto md:[&_*]:pointer-events-auto">
        <div className="container">
          <div className="flex flex-row items-center justify-between gap-4 md:gap-16">
            <Link to={'/'} className="h-[5.625rem] w-[9.606rem] flex items-center justify-center flex-shrink-0 p-px">
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
              className={`flex h-screen flex-col text-white fixed  md:flex-1 transition-all md:p-0 px-4 py-8 pt-24 duration-300 z-[100] bg-black w-full top-0 overflow-y-auto md:overflow-visible md:top-auto md:w-auto md:h-auto md:bg-transparent md:static md:z-auto ${isActive ? 'right-0' : '-right-[100vw]'
                }`}
            >
              <button
                onClick={closeMenu}
                className="md:hidden absolute top-4 right-4 z-10 h-[2.025rem] w-[1.881rem] text-lightgreen-100 hover:text-lightgreen-100 rounded-[.115rem] bg-darkolivegreen-200 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-[1.8px_1.8px_1.84px_1.4px_rgba(0,_0,_0,_0.91)_inset]"
              >
                X
              </button>
              <div className="items-center gap-[4.875rem] flex md:flex-row flex-col justify-center">
                <nav className="whitespace-nowrap text-[1.5rem] leading-[2rem] text-lightgreen-100 font-ocrx text-extrathin md:mr-auto">
                  <ul className="flex md:flex-row flex-col items-center justify-center gap-8 md:gap-9 md:pt-3">
                    <li>
                      <Link
                        target="_blank"
                        rel="noopener noreferrer"
                        to="https://bitlazer.gitbook.io"
                        className={`text-lightgreen-100  inline-block hover:scale-105 hover:line-through ${location.pathname === '/about' ? 'line-through pointer-events-none' : ''}`}
                        onClick={closeMenu}
                      >
                        [ABOUT]
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/bridge"
                        className={`text-lightgreen-100 inline-block hover:scale-105 hover:line-through ${location.pathname === '/bridge' ? 'line-through pointer-events-none' : ''}`}
                        onClick={closeMenu}
                      >
                        [BRIDGE]
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/ecosystem"
                        className={`text-lightgreen-100 inline-block hover:scale-105 hover:line-through ${location.pathname === '/ecosystem' ? 'line-through pointer-events-none' : ''}`}
                        onClick={closeMenu}
                      >
                        [ECOSYSTEM]
                      </Link>
                    </li>
                    <li>
                      <button
                        className={clsx(
                          'text-lightgreen-100 inline-block hover:scale-105 hover:line-through',
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
                      <button
                        className={clsx(
                          'text-lightgreen-100 inline-block hover:scale-105 hover:line-through',
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
                      <button
                        className={clsx(
                          'text-lightgreen-100 inline-block hover:scale-105 hover:line-through',
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
                  </ul>
                </nav>
              </div>
              <div className="flex md:hidden items-center space-x-0 mt-8 mx-auto justify-center flex-wrap ">
                {isConnected && (
                  <Button className="!w-auto uppercase min-w-[12.5rem] relative">
                    <div className="flex items-center gap-2">
                      {showArbitrum ? (
                        <>
                          <img src="/icons/crypto/arbitrum.svg" alt="ARB" className="w-5 h-5 brightness-0 invert" />
                          <span className="text-xs">
                            {arbitrumLoading ? 'Loading...' : `${formatBalance(arbitrumData?.value.toString() || '0')} lzrBTC`}
                          </span>
                        </>
                      ) : (
                        <>
                          <img src="/safari-pinned-tab.svg" alt="BLZ" className="w-10 h-10 brightness-0 invert" />
                          <span className="text-xs">
                            {bitlazerLoading ? 'Loading...' : `${formatBalance(bitlazerData?.value.toString() || '0')} lzrBTC`}
                          </span>
                        </>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowArbitrum(!showArbitrum)
                        }}
                        className="ml-auto flex flex-col text-white"
                      >
                        <span className="text-[10px] leading-[8px]">▲</span>
                        <span className="text-[10px] leading-[8px]">▼</span>
                      </button>
                    </div>
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (!isConnected) {
                      setOpenConnectWalletModal(!openConnectWalletModal)
                      closeMenu()
                    }
                  }}
                  className="!w-auto min-w-[12.5rem]"
                >
                  {isConnected ? <Account /> : 'CONNECT WALLET'}
                </Button>
              </div>
            </div>
            <div className="md:flex hidden items-center space-x-0">
              {isConnected && (
                <Button className="!w-auto uppercase min-w-[12.5rem] md:min-w-min relative">
                  <div className="flex items-center gap-2">
                    {showArbitrum ? (
                      <>
                        <img src="/icons/crypto/arbitrum.svg" alt="ARB" className="w-5 h-5 brightness-0 invert" />
                        <span className="text-xs">
                          {arbitrumLoading ? 'Loading...' : `${formatBalance(arbitrumData?.value.toString() || '0')} lzrBTC`}
                        </span>
                      </>
                    ) : (
                      <>
                        <img src="/safari-pinned-tab.svg" alt="BLZ" className="w-10 h-10 brightness-0 invert" />
                        <span className="text-xs">
                          {bitlazerLoading ? 'Loading...' : `${formatBalance(bitlazerData?.value.toString() || '0')} lzrBTC`}
                        </span>
                      </>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowArbitrum(!showArbitrum)
                      }}
                      className="ml-auto flex flex-col text-white"
                    >
                      <span className="text-[10px] leading-[8px]">▲</span>
                      <span className="text-[10px] leading-[8px]">▼</span>
                    </button>
                  </div>
                </Button>
              )}
              <Button
                onClick={() => {
                  if (!isConnected) {
                    setOpenConnectWalletModal(!openConnectWalletModal)
                    closeMenu()
                  }
                }}
                className="!w-auto min-w-[12.5rem]  md:min-w-min"
              >
                {isConnected ? <Account /> : 'CONNECT WALLET'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <MyModal
        label={'HOW IT WORKS'}
        width="md:w-[39.375rem]"
        position="md:top-1/3 md:left-1/4 md:-translate-x-1/3 md:-translate-y-1/3"
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
    </>
  )
}

export default Header

