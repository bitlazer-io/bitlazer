import React, { FC, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import BridgeDeposit from './wrap/BridgeWrap'
import BridgeStake from './stake/BridgeStake'
import BridgeWithdraw from './crosschain/BridgeCrosschain'
import { useAccount } from 'wagmi'
import BridgeConnect from './connect/BridgeConnect'
import clsx from 'clsx'

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

  return (
    <div className="w-full min-h-screen relative overflow-hidden flex flex-col justify-center py-32">
      <div className="container">
        <div className="flex flex-col items-center md:pointer-events-auto md:[&_*]:pointer-events-auto">
          <section className="w-full flex justify-center text-[1rem] text-white">
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
