import React, { useState, useEffect, useMemo } from 'react'
import { useAccount, useBalance, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { arbitrum } from 'wagmi/chains'
import { mainnet } from 'src/web3/chains'
import { ERC20_CONTRACT_ADDRESS, STAKING_CONTRACTS } from 'src/web3/contracts'
import { stakeAdapter_abi } from 'src/assets/abi/stakeAdapter'
import { fetchWithCache, CACHE_KEYS, CACHE_TTL, debouncedFetch } from 'src/utils/cache'
import { USDollar } from 'src/utils/formatters'
import Button from '@components/button/Button'
import { useNavigate } from 'react-router-dom'

interface LzrBTCBalanceProps {
  className?: string
}

export const LzrBTCBalance: React.FC<LzrBTCBalanceProps> = () => {
  const { address, isConnected } = useAccount()
  const navigate = useNavigate()
  const [btcPrice, setBtcPrice] = useState(0)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [priceLoading, setPriceLoading] = useState(true)

  // Fetch lzrBTC balance on Arbitrum
  const { data: arbitrumBalance, refetch: refetchArbitrumBalance } = useBalance({
    address: address,
    token: ERC20_CONTRACT_ADDRESS.lzrBTC as `0x${string}`,
    chainId: arbitrum.id,
  })

  // Fetch lzrBTC balance on Bitlazer L3 (native token)
  const { data: bitlazerBalance, refetch: refetchBitlazerBalance } = useBalance({
    address: address,
    chainId: mainnet.id,
  })

  // Fetch staked balance on Bitlazer
  const { data: stakedBalance, refetch: refetchStakedBalance } = useReadContract({
    abi: stakeAdapter_abi,
    address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
    functionName: 'balanceOf',
    args: address ? [address] : ['0x0000000000000000000000000000000000000000'],
    chainId: mainnet.id,
  })

  // Fetch BTC price from CoinGecko
  useEffect(() => {
    const fetchBTCPrice = async () => {
      try {
        setPriceLoading(true)
        const data = await fetchWithCache(
          CACHE_KEYS.BTC_PRICE,
          async () => {
            return debouncedFetch(CACHE_KEYS.BTC_PRICE, async () => {
              const response = await fetch(
                'https://api.coingecko.com/api/v3/simple/price?ids=wrapped-bitcoin&vs_currencies=usd',
              )
              if (!response.ok) throw new Error('Failed to fetch price')
              return response.json()
            })
          },
          { ttl: CACHE_TTL.PRICE },
        )

        const wbtcPrice = data['wrapped-bitcoin']?.usd || 0
        setBtcPrice(wbtcPrice)
      } catch (error) {
        console.error('Error fetching BTC price:', error)
      } finally {
        setPriceLoading(false)
      }
    }

    fetchBTCPrice()
    const interval = setInterval(fetchBTCPrice, 30000) // Update every 30s
    return () => clearInterval(interval)
  }, [])

  // Calculate total balance
  const balances = useMemo(() => {
    const arbBalance = arbitrumBalance ? Number(formatUnits(arbitrumBalance.value, 18)) : 0
    const l3Balance = bitlazerBalance ? Number(formatUnits(bitlazerBalance.value, 18)) : 0
    const staked = stakedBalance ? Number(formatUnits(stakedBalance as bigint, 18)) : 0

    return {
      arbitrum: arbBalance,
      bitlazer: l3Balance,
      staked: staked,
      total: arbBalance + l3Balance,
      totalWithStaking: arbBalance + l3Balance + staked,
    }
  }, [arbitrumBalance, bitlazerBalance, stakedBalance])

  const totalUSDValue = useMemo(() => {
    return balances.totalWithStaking * btcPrice
  }, [balances.totalWithStaking, btcPrice])

  // Refresh balances when popup opens
  const handlePopupToggle = () => {
    if (!isPopupOpen) {
      refetchArbitrumBalance()
      refetchBitlazerBalance()
      refetchStakedBalance()
    }
    setIsPopupOpen(!isPopupOpen)
  }

  if (!isConnected) return null

  return (
    <>
      {/* Header Balance Display - styled like the Connect Wallet button */}
      <Button onClick={handlePopupToggle} className="!w-auto uppercase min-w-[12rem] md:min-w-min">
        <div className="flex items-center justify-center gap-2">
          <img src="/icons/crypto/bitcoin.svg" alt="BTC" className="w-5 h-5 flex-shrink-0" />
          <span className="text-[1.5rem] flex items-center gap-1">
            {priceLoading ? (
              'Loading...'
            ) : (
              <>
                {USDollar.format(totalUSDValue)} <span className="text-lightgreen-100">lzrBTC</span>
              </>
            )}
          </span>
        </div>
      </Button>

      {/* Popup Modal */}
      {isPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed top-0 left-0 w-screen h-screen bg-black/80" onClick={() => setIsPopupOpen(false)} />
          <div className="relative max-w-xl w-full">
            <div className="w-full flex flex-col gap-[0.031rem]">
              {/* Header with green border all around */}
              <div className="self-stretch rounded-[.115rem] bg-forestgreen flex flex-col py-[0.187rem] px-[0.125rem]">
                <div className="self-stretch shadow-[-1.8px_-0.9px_3.69px_rgba(215,_215,_215,_0.18)_inset,_1.8px_1.8px_1.84px_rgba(0,_0,_0,_0.91)_inset] rounded-[.115rem] bg-darkolivegreen-200 flex flex-row items-center justify-between py-2 px-4 gap-4">
                  <div className="text-lightgreen-100 font-ocrx uppercase text-[1.25rem] md:text-[1.5rem]">
                    lzrBTC Token Balances
                  </div>
                  <button
                    onClick={() => setIsPopupOpen(false)}
                    className="h-8 w-8 text-lightgreen-100 hover:text-lightgreen-100 shadow-[1.8px_1.8px_1.84px_rgba(0,_0,_0,_0.91)_inset] rounded-[.115rem] bg-darkolivegreen-200 flex items-center justify-center font-ocrx text-xl transition-all duration-300 hover:shadow-[1.8px_1.8px_1.84px_1.4px_rgba(0,_0,_0,_0.91)_inset]"
                  >
                    X
                  </button>
                </div>
              </div>

              {/* Body content */}
              <div className="self-stretch -mt-[.1875rem] flex flex-col text-[1rem] text-white">
                <div className="bg-darkslategray-200 border-4 border-lightgreen-100 p-5">
                  {/* Total Balance Card */}
                  <div className="bg-black border-2 border-lightgreen-100 p-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lightgreen-100 text-lg font-ocrx uppercase">Total Balance</span>
                      <div className="text-right">
                        <div className="text-lightgreen-100 text-lg font-ocrx">
                          {balances.totalWithStaking.toFixed(6)} lzrBTC
                        </div>
                        <div className="text-white text-sm font-mono mt-1">{USDollar.format(totalUSDValue)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Network Balances */}
                  <div className="space-y-3">
                    {/* Arbitrum Balance */}
                    <div className="bg-black border-2 border-lightgreen-100 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <img src="/icons/crypto/arbitrum-color.svg" alt="ARB" className="w-10 h-10 flex-shrink-0" />
                          <div>
                            <div className="text-lightgreen-100 text-lg font-ocrx">Arbitrum</div>
                            <div className="text-white text-xs">Layer 2</div>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="flex items-center justify-between gap-8">
                            <span className="text-white text-sm uppercase">Balance</span>
                            <span className="text-lightgreen-100 font-mono text-sm">
                              {balances.arbitrum.toFixed(6)} lzrBTC
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-8">
                            <span className="text-white text-sm uppercase">Staked</span>
                            <span className="text-white/60 font-mono text-sm">0.00 lzrBTC</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bitlazer Balance */}
                    <div className="bg-black border-2 border-lightgreen-100 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <img src="/images/bitlazer-icon.svg" alt="BLZ" className="w-10 h-10 flex-shrink-0" />
                          <div>
                            <div className="text-lightgreen-100 text-lg font-ocrx">Bitlazer</div>
                            <div className="text-white text-xs">Native Network</div>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="flex items-center justify-between gap-8">
                            <span className="text-white text-sm uppercase">Balance</span>
                            <span className="text-lightgreen-100 font-mono text-sm">
                              {balances.bitlazer.toFixed(6)} lzrBTC
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-8">
                            <span className="text-white text-sm uppercase">Staked</span>
                            <span className="text-white/60 font-mono text-sm">{balances.staked.toFixed(6)} lzrBTC</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buy lzrBTC Button */}
                  <Button
                    className="w-full mt-6"
                    onClick={() => {
                      setIsPopupOpen(false)
                      navigate('/bridge/wrap')
                    }}
                  >
                    <span className="flex items-center justify-center gap-2 text-2xl">
                      Get lzrBTC
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
