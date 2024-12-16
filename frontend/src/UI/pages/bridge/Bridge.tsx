/* eslint-disable react/no-unescaped-entities */
import React, { FC, useEffect, useState } from 'react'
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
  const tabs: BridgeTab[] = [
    { id: 'deposit', name: 'WRAP' },
    { id: 'withdraw', name: 'BRIDGE' },
    { id: 'stake', name: 'STAKE' },
    { id: 'connect', name: 'CONNECT WALLET' },
  ]

  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [currentProgress, setCurrentProgress] = useState<number>(0)

  const { address, isConnected, chainId } = useAccount()

  const renderContent = () => {
    switch (activeTabId) {
      case 'deposit':
        return <BridgeDeposit />
      case 'stake':
        return <BridgeStake enabled={false} />
      case 'withdraw':
        return <BridgeWithdraw />
      case 'connect':
        return <BridgeConnect />
      default:
        return null
    }
  }

  useEffect(() => {
    const cookies = new Cookies()
    const cookie = cookies.get('bridgeTab')
    if (cookie && cookie !== 'connect') {
      setActiveTabId(cookie)
    } else {
      setActiveTabId('deposit')
    }
  }, [])

  useEffect(() => {
    const cookies = new Cookies()
    if (activeTabId !== 'connect') {
      console.log('Setting cookie tab to: ', activeTabId)
      cookies.set('bridgeTab', activeTabId)
    }
  }, [activeTabId])

  useEffect(() => {
    if (isConnected && activeTabId === 'connect') {
      setActiveTabId('deposit')
    } else if (!isConnected && activeTabId !== 'connect') {
      setActiveTabId('connect')
    }
  }, [isConnected, activeTabId])

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
          <section className="md:max-w-[62.919rem] w-full flex md:flex-row flex-col-reverse text-[1rem] text-white ">
            <div className="md:max-w-[30.95rem] w-full flex flex-col md:pt-10">
              <div className="bg-black font-ocrx  border-white border-[.075rem] border-dashed flex flex-col md:pt-[2.562rem] md:pb-[2.25rem] md:pl-[2.5rem] md:pr-[0.5rem] px-4 py-6 md:gap-[2.375rem] gap-6 md:min-h-[44.6875rem]">
                <div className="relative tracking-[-0.06em] leading-[1.313rem] text-2xl">## HOW IT WORKS</div>
                <div className="flex flex-col gap-10 max-w-[27rem] flex-1">
                  <div className="flex flex-col gap-[2.375rem]">
                    <div className="flex flex-col gap-4">
                      <div className="text-2xl">
                        <span>[ Step 1 | </span>
                        <span className="text-fuchsia">Wrap Bitcoin to Bitlazer BTC</span>
                        <span> ] </span>
                      </div>
                      <div className="tracking-[-0.06em] leading-[1.313rem] font-maison-neue">
                        Embark on a secure and efficient journey as you transform your Bitcoin (BTC) into lzrBTC. This
                        innovative process allows you to harness the power of Bitcoin while enjoying the benefits of
                        enhanced liquidity and flexibility. By wrapping your BTC, you’re not just converting your
                        assets; you’re entering a world of possibilities. Our platform ensures that this transition is
                        not only safe but also straightforward, utilizing cutting-edge technology to protect your
                        investments at every step.
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="text-2xl">
                        <span>[ Step 2 | </span>
                        <span className="text-fuchsia">Bridge Bitcoin to Bitlazer</span>
                        <span> ] </span>
                      </div>
                      <div className="tracking-[-0.06em] leading-[1.313rem] font-maison-neue">
                        Users can bridge their Wrapped Bitcoin (WBTC) from Ethereum to Bitlazer's Layer 3 (L3) network,
                        or directly deposit native Bitcoin (BTC) using the BTC-native bridge, powered by light client
                        technology. This process securely transfers assets to the L3 Bitlazer network, where they can
                        participate in decentralized applications (dApps).
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="text-2xl">
                        <span>[ Step 3 | </span>
                        <span className="text-fuchsia">Stake L3 BTC or LZR Tokens</span>
                        <span> ] </span>
                      </div>
                      <div className="tracking-[-0.06em] leading-[1.313rem] font-maison-neue">
                        <p className="m-0">
                          Once assets are bridged, users can participate in Bitlazer’s dual staking rewards program.
                          They have the option to stake either:
                        </p>
                        <p className="m-0">/ L3 BTC, earning rewards in Bitlazer's native token, LZR.</p>
                        <p className="m-0">
                          / LZR Tokens, earning both governance rights and a share of the gas fees generated by the
                          platform, paid in BTC.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="text-2xl">
                        <span>[ Step 4 | </span>
                        <span className="text-fuchsia">Claim Airdrop and Earn Yield</span>
                        <span> ] </span>
                      </div>
                      <div className="tracking-[-0.06em] leading-[1.313rem] font-maison-neue">
                        <p className="m-0">
                          Users who bridge their BTC and actively participate in staking can also qualify for the
                          airdrop of LZR tokens. Early bridgers receive an additional 20% bonus from the total LZR
                          supply allocated for the airdrop, incentivizing active engagement and early adoption of the
                          Bitlazer ecosystem.
                        </p>
                        <p className="m-0">
                          These steps ensure that users not only receive staking rewards but also benefit from the LZR
                          airdrop, maximizing their participation in the Bitlazer network’s growth.
                        </p>
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
                {tabs.map(
                  (tab) =>
                    tab.id !== 'connect' && (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTabId(tab.id)}
                        disabled={tab.id === 'stake'}
                        className={clsx(
                          'font-ocrx w-full cursor-pointer rounded-[.115rem] h-10 text-lightgreen-100 text-[1.25rem] whitespace-nowrap flex py-[0.187rem] px-[0.125rem] transition-all duration-300 group',
                          activeTabId === tab.id
                            ? 'bg-forestgreen pointer-events-none touch-none'
                            : 'bg-darkslategray-200',
                        )}
                      >
                        <span
                          className={clsx(
                            'px-[0.875rem] h-full shadow-[-1.8px_-0.9px_3.69px_rgba(215,_215,_215,_0.18)_inset,_1.8px_1.8px_1.84px_rgba(0,_0,_0,_0.91)_inset] rounded-[.115rem] flex items-center justify-center text-center transition-all duration-300 w-full',
                            activeTabId === tab.id ? 'bg-darkolivegreen-200' : 'group-hover:bg-dimgray-200',
                            tab.id === 'stake' ? 'bg-dimgray-200' : 'bg-black',
                          )}
                        >
                          {tab.name}
                        </span>
                      </button>
                    ),
                )}
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
