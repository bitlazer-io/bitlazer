import React, { FC, useState, useEffect } from 'react'
import clsx from 'clsx'
import { Button } from '@components/index'

interface ILZRStake {
  onBack: () => void
}

const LZRStake: FC<ILZRStake> = ({ onBack }) => {
  const [stakeAmount, setStakeAmount] = useState(1000)
  const [inputValue, setInputValue] = useState('1000')
  const [lzrBalance] = useState(0) // Mock balance since LZR doesn't exist yet
  const [baseAPY] = useState(12.5) // Base APY
  const [selectedLockPeriod, setSelectedLockPeriod] = useState(30) // Default 30 days
  const [lockPeriodBonus, setLockPeriodBonus] = useState(0.5) // Default bonus for 30 days
  const [currentAPY, setCurrentAPY] = useState(12.5)
  const [lockedPercentage] = useState(38.2) // Mock locked percentage

  // Lock period options with their APY bonuses (increased values)
  const lockPeriods = [
    { days: 30, bonus: 0.5 },
    { days: 90, bonus: 1.2 },
    { days: 180, bonus: 2.5 },
    { days: 365, bonus: 5.0 },
  ]

  // Calculate total APY based on lock period only
  useEffect(() => {
    // Total APY = base + lock period bonus
    setCurrentAPY(baseAPY + lockPeriodBonus)
  }, [baseAPY, lockPeriodBonus])

  const handleIncrement = () => {
    const newAmount = stakeAmount + 1000
    setStakeAmount(newAmount)
    setInputValue(newAmount.toString())
  }

  const handleDecrement = () => {
    if (stakeAmount > 1000) {
      const newAmount = stakeAmount - 1000
      setStakeAmount(newAmount)
      setInputValue(newAmount.toString())
    }
  }

  const handleInputChange = (value: string) => {
    // Allow only numbers
    const numericValue = value.replace(/[^0-9]/g, '')
    setInputValue(numericValue)

    const parsedValue = parseInt(numericValue) || 0
    setStakeAmount(parsedValue)
  }

  // Calculate bonus satoshis
  const calculateBonusSatoshis = () => {
    return Math.floor(stakeAmount / 1000)
  }

  // Convert LZR to satoshis (1 satoshi = 1000 LZR)
  const lzrToSatoshis = (lzr: number) => {
    return lzr / 1000
  }

  const handleLockPeriodSelect = (days: number, bonus: number) => {
    setSelectedLockPeriod(days)
    setLockPeriodBonus(bonus)
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
          <h2 className="text-xl font-ocrx uppercase text-fuchsia mb-3">Stake to earn Bitcoin</h2>
          <div className="tracking-[-0.06em] leading-[1.313rem] text-sm">
            Stake <span className="text-lightgreen-100 font-semibold">LZR</span> to participate in the Bitlazer protocol
            and earn Bitcoin rewards every week. Stake in multiples of 1000{' '}
            <span className="text-lightgreen-100 font-semibold">LZR</span> on Arbitrum chain and choose longer periods
            for higher APY.
          </div>
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
              <span>1 Satoshi = 1000 LZR tokens. For every 1000 LZR staked, you receive 1 bonus satoshi!</span>
            </p>
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
            <div className="text-white/60 text-sm uppercase font-ocrx mb-1">LZR locked</div>
            <div className="text-lg font-bold font-maison-neue text-white">{lockedPercentage}%</div>
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
              <span className="text-white">Stake</span> <span className="text-lightgreen-100">LZR</span>
            </span>
            <span className="text-white/60 text-xs font-maison-neue">{lzrBalance} available</span>
          </div>

          <div className="flex items-center justify-between bg-darkslategray-100/50 p-3 rounded">
            <button
              onClick={handleDecrement}
              disabled={stakeAmount <= 1000}
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                stakeAmount > 1000
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
                ≈ {lzrToSatoshis(stakeAmount).toFixed(2)} satoshis
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

          {/* Multiplier Info */}
          <div className="mt-3 p-2 bg-darkslategray-100/30 rounded">
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-xs font-maison-neue">Staking Multiplier:</span>
              <span className="text-white font-maison-neue font-semibold text-sm">
                {Math.floor(stakeAmount / 1000)}x
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-white/60 text-xs font-maison-neue">Bonus Satoshis:</span>
              <span className="text-lightgreen-100 font-maison-neue font-semibold text-sm">
                +{calculateBonusSatoshis()} sats
              </span>
            </div>
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

        {/* Coming Soon Button - using actual Button component */}
        <Button disabled className="opacity-50 cursor-not-allowed">
          COMING SOON
        </Button>

        {/* Additional Info */}
        <div className="mt-3 text-center">
          <p className="text-[10px] font-maison-neue text-white/30">
            LZR token staking will be available after mainnet launch. Preview interface only.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LZRStake
