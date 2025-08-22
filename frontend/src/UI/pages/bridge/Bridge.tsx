import React, { FC, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import BridgeDeposit from './wrap/BridgeWrap'
import BridgeStake from './stake/BridgeStake'
import BridgeWithdraw from './crosschain/BridgeCrosschain'
import { useAccount } from 'wagmi'
import BridgeConnect from './connect/BridgeConnect'
import clsx from 'clsx'
import Cookies from 'universal-cookie'

interface IBridge {}
interface BridgeTab {
  id: string
  name: string
}

const Bridge: FC<IBridge> = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const tabs: BridgeTab[] = [
    { id: 'wrap', name: 'WRAP' },
    { id: 'crosschain', name: 'BRIDGE' },
    { id: 'stake', name: 'STAKE' },
    { id: 'connect', name: 'CONNECT WALLET' },
  ]

  const [currentProgress, setCurrentProgress] = useState<number>(0)
  const { isConnected } = useAccount()

  // Get active tab from URL path
  const getActiveTabFromPath = () => {
    const pathSegments = location.pathname.split('/')
    const lastSegment = pathSegments[pathSegments.length - 1]

    // Map old IDs to new paths for backward compatibility
    const pathMap: { [key: string]: string } = {
      deposit: 'wrap',
      withdraw: 'crosschain',
    }

    return pathMap[lastSegment] || lastSegment || 'wrap'
  }

  const activeTabId = getActiveTabFromPath()

  const renderContent = () => {
    // Show connect wallet component if not connected
    if (!isConnected) {
      return <BridgeConnect />
    }

    switch (activeTabId) {
      case 'wrap':
        return <BridgeDeposit />
      case 'stake':
        return <BridgeStake />
      case 'crosschain':
        return <BridgeWithdraw />
      default:
        return <BridgeDeposit />
    }
  }

  const handleTabChange = (tabId: string) => {
    if (tabId === 'connect') {
      // Don't add connect to URL path
      return
    }
    // Don't use replace: true so it creates browser history
    navigate(`/bridge/${tabId}`)
  }

  useEffect(() => {
    // When user connects wallet and we're on the default bridge route, redirect to wrap
    if (isConnected && location.pathname === '/bridge') {
      navigate('/bridge/wrap', { replace: true })
    }
  }, [isConnected, location.pathname, navigate])

  useEffect(() => {
    if (isConnected) {
      const cookies = new Cookies()
      const hasWrapped = (): boolean => {
        return cookies.get('hasWrapped') === true
      }

      const hasBridged = (): boolean => {
        return cookies.get('hasBridged') === true
      }

      const hasStaked = (): boolean => {
        return cookies.get('hasStaked') === true
      }

      let progress = 0

      if (hasWrapped()) {
        progress = hasBridged() ? (hasStaked() ? 4 : 3) : hasStaked() ? 4 : 2
      } else {
        progress = hasBridged() ? (hasStaked() ? 4 : 3) : hasStaked() ? 4 : 1
      }

      setCurrentProgress(progress)
    }
  }, [isConnected])

  return (
    <div className="w-full min-h-screen relative overflow-hidden flex flex-col justify-center py-32">
      <div className="container">
        <div className="flex flex-col items-center md:pointer-events-auto md:[&_*]:pointer-events-auto">
          <section className="md:max-w-[62.919rem] w-full flex md:flex-row flex-col-reverse text-[1rem] text-white md:items-stretch">
            <div className="md:max-w-[30.95rem] w-full flex flex-col md:pt-10">
              <div className="bg-black font-ocrx  border-white border-[.075rem] border-dashed flex flex-col md:pt-[2.562rem] md:pb-[2.25rem] md:pl-[2.5rem] md:pr-[0.5rem] px-4 py-6 md:gap-[2.375rem] gap-6 h-full">
                <div className="relative tracking-[-0.06em] leading-[1.313rem] text-2xl">## HOW IT WORKS</div>
                <div className="flex flex-col gap-10 max-w-[27rem] flex-1 text-2xl">
                  <div className="flex flex-col gap-[2.375rem]">
                    <div className="flex flex-col gap-4">
                      <div className="text-2xl">
                        <span>[ Step 1 | </span>
                        <span className="text-fuchsia">Convert WBTC to lzrBTC</span>
                        <span> ] </span>
                      </div>
                      <div className="tracking-[-0.06em] leading-[1.313rem] ">
                        Convert your Wrapped Bitcoin (WBTC) in Arbitrum to lzrBTC in Arbitrum
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="text-2xl">
                        <span>[ Step 2 | </span>
                        <span className="text-fuchsia">Bridge lzrBTC to Bitlazer </span>
                        <span> ] </span>
                      </div>
                      <div className="tracking-[-0.06em] leading-[1.313rem] ">
                        <p className="m-0">Securely bridge your lzrBTC in Arbitrum to Bitlazer</p>
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
                          Seamlessly stake your lzrBTC in Bitlazer to earn native Bitcoin gas fee rewards and LZR tokens
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="text-2xl">
                        <span>[ Step 4 | </span>
                        <span className="text-fuchsia">Unstake and Collect Rewards </span>
                        <span> ] </span>
                      </div>
                      <div className="tracking-[-0.06em] leading-[1.313rem] ">
                        <p className="m-0">Unstake and unwrap your lzrBTC to claim your rewards</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-[0.312rem] mt-auto overflow-hidden">
                    <div className="relative inline-flex flex-row max-w-full text-base font-normal  font-arial ">
                      <div className={currentProgress > 0 ? 'text-[#66d560]' : ''}>░░░░░░░░░</div>
                      <div className={currentProgress > 1 ? 'text-[#66d560]' : ''}>░░░░░░░░░</div>
                      <div className={currentProgress > 2 ? 'text-[#66d560]' : ''}>░░░░░░░░░</div>
                      <div className={currentProgress > 3 ? 'text-[#66d560]' : ''}>░░░░░░░░░</div>
                    </div>
                    <div className="tracking-[-0.06em] leading-[1.25rem] font-ocrx text-2xl mt-2">
                      CURRENT PROGRESS{' '}
                      <span className="font-ocrx">
                        {currentProgress}/4 <span className="">[</span> {Math.round((currentProgress / 4) * 100)}%{' '}
                        <span className="font-">]</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:max-w-[31.75rem] w-full flex flex-col">
              <div className="grid grid-cols-3 relative z-10">
                {tabs
                  .filter((tab) => tab.id !== 'connect')
                  .map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      disabled={!isConnected}
                      className={clsx(
                        'font-ocrx w-full cursor-pointer rounded-[.115rem] h-10 text-lightgreen-100 text-[1.25rem] whitespace-nowrap flex py-[0.187rem] px-[0.125rem] transition-all duration-300 group',
                        activeTabId === tab.id
                          ? 'bg-forestgreen pointer-events-none touch-none'
                          : 'bg-darkslategray-200',
                        !isConnected && 'opacity-50 cursor-not-allowed',
                      )}
                    >
                      <span
                        className={clsx(
                          'px-[0.875rem] h-full leading-[50%] pt-3 shadow-[-1.8px_-0.9px_3.69px_rgba(215,_215,_215,_0.18)_inset,_1.8px_1.8px_1.84px_rgba(0,_0,_0,_0.91)_inset] rounded-[.115rem] flex items-center justify-center text-center transition-all duration-300 w-full',
                          activeTabId === tab.id ? 'bg-darkolivegreen-200' : 'bg-black group-hover:bg-dimgray-200',
                        )}
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
