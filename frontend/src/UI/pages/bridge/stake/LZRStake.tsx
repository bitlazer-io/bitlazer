import React, { FC, useState, useEffect } from 'react'
import clsx from 'clsx'
import { Button, TXToast } from '@components/index'
import Loading from '@components/loading/Loading'
import { toast } from 'react-toastify'
import { useBalance, useAccount, useSwitchChain, useReadContract } from 'wagmi'
import { waitForTransactionReceipt, writeContract } from '@wagmi/core'
import { formatEther, parseUnits } from 'ethers/lib/utils'
import { stakeAdapter_abi } from 'src/assets/abi/stakeAdapter'
import { config } from 'src/web3/config'
import { ERC20_CONTRACT_ADDRESS, STAKING_CONTRACTS } from 'src/web3/contracts'
import { arbitrum } from 'viem/chains'
import { SUPPORTED_CHAINS } from 'src/web3/chains'
import { usePriceStore } from 'src/stores/priceStore'

interface ILZRStake {
  onBack: () => void
}

const LZRStake: FC<ILZRStake> = ({ onBack }) => {
  const { address, chainId, isConnected } = useAccount()
  const { switchChain } = useSwitchChain()
  const [stakeSatoshis, setStakeSatoshis] = useState(1000) // Satoshis to stake
  const [inputValue, setInputValue] = useState('1000')
  const [baseAPY] = useState(12.5) // Base APY
  const [selectedLockPeriod, setSelectedLockPeriod] = useState(30) // Default 30 days
  const [lockPeriodBonus, setLockPeriodBonus] = useState(0.5) // Default bonus for 30 days
  const [currentAPY, setCurrentAPY] = useState(12.5)
  const [isStaking, setIsStaking] = useState(false)
  const [isOnBitlazer, setIsOnBitlazer] = useState(false)

  // Get BTC price from global store
  const { btcPrice } = usePriceStore()

  // Check if user is on Bitlazer L3
  useEffect(() => {
    setIsOnBitlazer(chainId === SUPPORTED_CHAINS.bitlazerL3.id)
  }, [chainId])

  // Get user's LZR balance on Arbitrum One (this determines staking capacity)
  const { data: lzrBalance } = useBalance({
    address: address,
    token: ERC20_CONTRACT_ADDRESS.lzr as `0x${string}`,
    chainId: arbitrum.id,
  })

  // Get user's lzrBTC balance on Bitlazer L3 (native token)
  const { data: lzrBTCBalance, refetch: refetchLzrBTCBalance } = useBalance({
    address: address,
    chainId: SUPPORTED_CHAINS.bitlazerL3.id,
  })

  // Get user's staked balance
  const { data: stakedBalance } = useReadContract({
    abi: stakeAdapter_abi,
    address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
    functionName: 'balanceOf',
    args: address ? [address] : ['0x0000000000000000000000000000000000000000'],
    chainId: SUPPORTED_CHAINS.bitlazerL3.id,
  })

  // Lock period options with their APY bonuses
  const lockPeriods = [
    { days: 30, bonus: 0.5 },
    { days: 90, bonus: 1.2 },
    { days: 180, bonus: 2.5 },
    { days: 365, bonus: 5.0 },
  ]

  // Calculate total APY based on lock period only
  useEffect(() => {
    setCurrentAPY(baseAPY + lockPeriodBonus)
  }, [baseAPY, lockPeriodBonus])

  const handleIncrement = () => {
    const newAmount = stakeSatoshis + 1000
    setStakeSatoshis(newAmount)
    setInputValue(newAmount.toString())
  }

  const handleDecrement = () => {
    if (stakeSatoshis > 1000) {
      const newAmount = stakeSatoshis - 1000
      setStakeSatoshis(newAmount)
      setInputValue(newAmount.toString())
    }
  }

  const handleInputChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '')
    setInputValue(numericValue)
    const parsedValue = parseInt(numericValue) || 0
    setStakeSatoshis(parsedValue)
  }

  // Calculate required LZR tokens (1 LZR per 1000 satoshis)
  const calculateRequiredLZR = () => {
    return Math.ceil(stakeSatoshis / 1000)
  }

  // Convert satoshis to lzrBTC (1 lzrBTC = 100,000,000 satoshis)
  const satoshisToLzrBTC = (sats: number) => {
    return sats / 100000000
  }

  // Check if user has enough LZR tokens
  const hasEnoughLZR = () => {
    if (!lzrBalance) return false
    const requiredLZR = calculateRequiredLZR()
    const userLZRBalance = parseFloat(formatEther(lzrBalance.value))
    return userLZRBalance >= requiredLZR
  }

  // Check if user has enough lzrBTC
  const hasEnoughLzrBTC = () => {
    if (!lzrBTCBalance) return false
    const requiredLzrBTC = satoshisToLzrBTC(stakeSatoshis)
    const userLzrBTCBalance = parseFloat(formatEther(lzrBTCBalance.value))
    return userLzrBTCBalance >= requiredLzrBTC
  }

  const handleLockPeriodSelect = (days: number, bonus: number) => {
    setSelectedLockPeriod(days)
    setLockPeriodBonus(bonus)
  }

  const handleSwitchToBitlazer = async () => {
    if (switchChain) {
      try {
        await switchChain({ chainId: SUPPORTED_CHAINS.bitlazerL3.id })
      } catch (error) {
        console.error('Failed to switch chain:', error)
        toast.error('Failed to switch to Bitlazer L3')
      }
    }
  }

  const handleStake = async () => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet')
      return
    }

    if (!isOnBitlazer) {
      toast.error('Please switch to Bitlazer L3 network')
      return
    }

    if (stakeSatoshis < 1000 || stakeSatoshis % 1000 !== 0) {
      toast.error('Stake amount must be in multiples of 1000 satoshis')
      return
    }

    if (!hasEnoughLZR()) {
      const requiredLZR = calculateRequiredLZR()
      toast.error(`Insufficient LZR tokens. You need ${requiredLZR} LZR on Arbitrum One`)
      return
    }

    if (!hasEnoughLzrBTC()) {
      const requiredLzrBTC = satoshisToLzrBTC(stakeSatoshis)
      toast.error(`Insufficient lzrBTC balance. You need ${requiredLzrBTC.toFixed(8)} lzrBTC`)
      return
    }

    setIsStaking(true)

    try {
      // Convert satoshis to lzrBTC amount with 18 decimals
      const lzrBTCAmount = parseUnits(satoshisToLzrBTC(stakeSatoshis).toFixed(8), 18)

      // Call stake function on the staking adapter
      const hash = await writeContract(config, {
        address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
        abi: stakeAdapter_abi,
        functionName: 'stake',
        args: [lzrBTCAmount],
        chainId: SUPPORTED_CHAINS.bitlazerL3.id,
      })

      const toastId = toast(<TXToast message="Staking lzrBTC with LZR multiplier..." txHash={hash} />, {
        autoClose: false,
        closeButton: false,
      })

      // Wait for transaction confirmation
      const receipt = await waitForTransactionReceipt(config, {
        hash,
        chainId: SUPPORTED_CHAINS.bitlazerL3.id,
      })

      toast.dismiss(toastId)

      if (receipt.status === 'success') {
        toast.success(`Successfully staked ${stakeSatoshis} satoshis with LZR multiplier!`)
      } else {
        toast.error('Transaction failed. Please try again.')
      }
    } catch (error: any) {
      console.error('Staking error:', error)

      if (error.message?.includes('insufficient')) {
        toast.error('Insufficient balance or gas fees')
      } else if (error.message?.includes('rejected')) {
        toast.error('Transaction rejected by user')
      } else {
        toast.error('Staking failed. Please try again.')
      }
    } finally {
      setIsStaking(false)
      await refetchLzrBTCBalance()
    }
  }

  // Format balance display
  const formatBalance = (balance: any, decimals: number = 2) => {
    if (!balance) return '0'
    try {
      const formatted = formatEther(balance.value)
      return parseFloat(formatted).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      })
    } catch {
      return '0'
    }
  }

  // Calculate USD value for BTC amount
  const calculateUSDValue = (btcAmount: number) => {
    if (!btcPrice) return '0'
    const usdValue = btcAmount * btcPrice
    return usdValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Get BTC amount from balance
  const getBalanceInBTC = (balance: any) => {
    if (!balance) return 0
    try {
      return parseFloat(formatEther(balance.value))
    } catch {
      return 0
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-4 text-lightgreen-100 hover:text-lightgreen-100/80 transition-colors flex items-center gap-2 group"
      >
        <svg
          className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-maison-neue uppercase text-xs">Back to Basic Staking</span>
      </button>

      {/* Main Card */}
      <div className="bg-gradient-to-br from-darkslategray-200/90 via-darkslategray-200/70 to-fuchsia/10 backdrop-blur-sm border border-fuchsia/50 p-4 md:p-6 rounded-[.115rem]">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-ocrx uppercase text-fuchsia mb-3">Enhanced Staking with LZR</h2>
          <div className="tracking-[-0.06em] leading-[1.313rem] text-sm">
            Stake your <span className="text-lightgreen-100 font-semibold">lzrBTC</span> with{' '}
            <span className="text-lightgreen-100 font-semibold">LZR</span> tokens to earn enhanced rewards. Each LZR
            token on Arbitrum One allows you to stake 1000 satoshis of lzrBTC on Bitlazer L3.
          </div>
          {btcPrice && isConnected && (
            <div className="mt-3 p-2 bg-darkslategray-100/30 rounded flex justify-between items-center">
              <span className="text-xs font-maison-neue text-white/60">Total Portfolio Value:</span>
              <span className="text-sm font-bold font-maison-neue text-lightgreen-100">
                ${calculateUSDValue(getBalanceInBTC(lzrBTCBalance) + getBalanceInBTC({ value: stakedBalance }))}
              </span>
            </div>
          )}
          <div className="mt-3 p-2 bg-fuchsia/10 border border-fuchsia/30 rounded">
            <p className="text-xs font-maison-neue text-fuchsia flex items-center gap-1">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>1 LZR token (on Arbitrum) = Ability to stake 1000 satoshis (on Bitlazer)</span>
            </p>
          </div>
        </div>

        {/* Balance Info */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-darkslategray-100/50 p-3 rounded">
            <div className="text-white/60 text-xs uppercase font-ocrx mb-1">Your LZR</div>
            <div className="text-sm font-bold font-maison-neue text-lightgreen-100">
              {isConnected ? formatBalance(lzrBalance) : '0'}
            </div>
            <div className="text-xs font-maison-neue text-white/40 mt-1">on Arbitrum</div>
          </div>
          <div className="bg-darkslategray-100/50 p-3 rounded">
            <div className="text-white/60 text-xs uppercase font-ocrx mb-1">Your lzrBTC</div>
            <div className="text-sm font-bold font-maison-neue text-lightgreen-100">
              {isConnected && isOnBitlazer ? formatBalance(lzrBTCBalance, 8) : '0'}
            </div>
            <div className="text-xs font-maison-neue text-white/40 mt-1">
              ${calculateUSDValue(getBalanceInBTC(lzrBTCBalance))}
            </div>
          </div>
          <div className="bg-darkslategray-100/50 p-3 rounded">
            <div className="text-white/60 text-xs uppercase font-ocrx mb-1">Staked</div>
            <div className="text-sm font-bold font-maison-neue text-fuchsia">
              {stakedBalance ? formatBalance({ value: stakedBalance }, 8) : '0'}
            </div>
            <div className="text-xs font-maison-neue text-white/40 mt-1">
              ${calculateUSDValue(getBalanceInBTC({ value: stakedBalance }))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-darkslategray-100/50 p-3 rounded">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-white/60 text-sm uppercase font-ocrx">APY</span>
              <div className="group relative">
                <svg className="w-3 h-3 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="absolute bottom-5 left-0 invisible group-hover:visible bg-black/90 text-white text-xs p-2 rounded whitespace-nowrap z-10">
                  Annual Percentage Yield
                </div>
              </div>
            </div>
            <div className="text-lg font-bold font-maison-neue text-fuchsia">{currentAPY.toFixed(2)}%</div>
            {currentAPY > baseAPY && (
              <div className="text-xs font-maison-neue text-lightgreen-100 mt-1">
                +{(currentAPY - baseAPY).toFixed(1)}% bonus
              </div>
            )}
          </div>

          <div className="bg-darkslategray-100/50 p-3 rounded">
            <div className="text-white/60 text-sm uppercase font-ocrx mb-1">Staking Cap</div>
            <div className="text-lg font-bold font-maison-neue text-white">
              {isConnected && lzrBalance
                ? `${Math.floor(parseFloat(formatEther(lzrBalance.value)) * 1000)} sats`
                : '0 sats'}
            </div>
            <div className="text-xs font-maison-neue text-white/40">Max you can stake</div>
          </div>

          <div className="bg-darkslategray-100/50 p-3 rounded">
            <div className="text-white/60 text-sm uppercase font-ocrx mb-1">Lock Period</div>
            <div className="text-lg font-bold font-maison-neue text-white">{selectedLockPeriod} days</div>
          </div>
        </div>

        {/* Stake Input Section */}
        <div className="bg-darkslategray-100/30 p-4 rounded mb-4">
          <div className="flex justify-between items-center mb-3">
            <span className="font-maison-neue font-semibold text-sm">
              <span className="text-white">Stake</span> <span className="text-lightgreen-100">Satoshis</span>
            </span>
            <span className="text-white/60 text-xs font-maison-neue">Requires {calculateRequiredLZR()} LZR</span>
          </div>

          <div className="flex items-center justify-between bg-darkslategray-100/50 p-3 rounded">
            <button
              onClick={handleDecrement}
              disabled={stakeSatoshis <= 1000}
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                stakeSatoshis > 1000
                  ? 'bg-fuchsia/20 hover:bg-fuchsia/30 text-fuchsia border border-fuchsia/50'
                  : 'bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600',
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>

            <div className="text-center flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                autoComplete="off"
                className="text-2xl font-bold font-maison-neue text-white mb-1 bg-transparent border-0 text-center w-full focus:outline-none"
                placeholder="0"
              />
              <div className="text-xs font-maison-neue text-white/60">
                ≈ {satoshisToLzrBTC(stakeSatoshis).toFixed(8)} lzrBTC
                {btcPrice && (
                  <span className="text-lightgreen-100 ml-2">
                    (${calculateUSDValue(satoshisToLzrBTC(stakeSatoshis))})
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleIncrement}
              className="w-8 h-8 rounded-full bg-lightgreen-100/20 hover:bg-lightgreen-100/30 text-lightgreen-100 border border-lightgreen-100/50 flex items-center justify-center transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Requirements Info */}
          <div className="mt-3 p-2 bg-darkslategray-100/30 rounded space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-xs font-maison-neue">LZR Required:</span>
              <span
                className={clsx(
                  'font-maison-neue font-semibold text-sm',
                  hasEnoughLZR() ? 'text-lightgreen-100' : 'text-red-400',
                )}
              >
                {calculateRequiredLZR()} LZR {hasEnoughLZR() ? '✓' : '✗'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-xs font-maison-neue">lzrBTC Required:</span>
              <span
                className={clsx(
                  'font-maison-neue font-semibold text-sm',
                  hasEnoughLzrBTC() ? 'text-lightgreen-100' : 'text-red-400',
                )}
              >
                {satoshisToLzrBTC(stakeSatoshis).toFixed(8)} {hasEnoughLzrBTC() ? '✓' : '✗'}
              </span>
            </div>
            {btcPrice && stakeSatoshis > 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-white/60 text-xs font-maison-neue">Projected Annual Earnings:</span>
                <span className="font-maison-neue font-semibold text-sm text-fuchsia">
                  ${calculateUSDValue(satoshisToLzrBTC(stakeSatoshis) * (currentAPY / 100))}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Staking Period Selector */}
        <div className="mb-4">
          <div className="text-white font-maison-neue font-semibold text-sm mb-2">Lock Period</div>
          <div className="grid grid-cols-4 gap-2">
            {lockPeriods.map(({ days, bonus }) => (
              <button
                key={days}
                onClick={() => handleLockPeriodSelect(days, bonus)}
                className={clsx(
                  'p-2 rounded transition-all border',
                  selectedLockPeriod === days
                    ? 'bg-fuchsia/30 border-fuchsia text-white'
                    : 'bg-darkslategray-100/30 hover:bg-fuchsia/20 border-transparent hover:border-fuchsia/50',
                )}
              >
                <div className="text-white font-maison-neue font-semibold text-sm">{days}d</div>
                <div className="text-xs font-maison-neue text-white/60">+{bonus}% APY</div>
              </button>
            ))}
          </div>
        </div>

        {/* Staking Button */}
        {isConnected ? (
          isOnBitlazer ? (
            <Button
              onClick={handleStake}
              disabled={
                isStaking || stakeSatoshis < 1000 || stakeSatoshis % 1000 !== 0 || !hasEnoughLZR() || !hasEnoughLzrBTC()
              }
              className={clsx((isStaking || !hasEnoughLZR() || !hasEnoughLzrBTC()) && 'opacity-50 cursor-not-allowed')}
            >
              {isStaking ? (
                <div className="flex items-center gap-2">
                  <Loading />
                  <span>STAKING...</span>
                </div>
              ) : !hasEnoughLZR() ? (
                'INSUFFICIENT LZR TOKENS'
              ) : !hasEnoughLzrBTC() ? (
                'INSUFFICIENT LZRBTC'
              ) : (
                'STAKE WITH LZR MULTIPLIER'
              )}
            </Button>
          ) : (
            <Button onClick={handleSwitchToBitlazer}>SWITCH TO BITLAZER L3</Button>
          )
        ) : (
          <Button disabled className="opacity-50 cursor-not-allowed">
            CONNECT WALLET TO STAKE
          </Button>
        )}

        {/* Additional Info */}
        <div className="mt-3 text-center">
          <p className="text-[10px] font-maison-neue text-white/30">
            LZR token contract (Arbitrum): {ERC20_CONTRACT_ADDRESS.lzr}
          </p>
          <p className="text-[10px] font-maison-neue text-white/30 mt-1">
            Stake lzrBTC with LZR multiplier for enhanced rewards.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LZRStake
