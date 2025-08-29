import { Button, TXToast } from '@components/index'
import Loading from '@components/loading/Loading'
import React, { FC, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'
import { useBalance, useAccount, useReadContract } from 'wagmi'
import { waitForTransactionReceipt, writeContract } from '@wagmi/core'
import { stakeAdapter_abi } from 'src/assets/abi/stakeAdapter'
import { formatEther } from 'ethers/lib/utils'
import { mainnet } from 'src/web3/chains'
import { handleChainSwitch } from 'src/web3/functions'
import { config } from 'src/web3/config'
import { STAKING_CONTRACTS } from 'src/web3/contracts'
import { parseUnits } from 'viem'
import clsx from 'clsx'
import { useEffect } from 'react'
import { fetchWithCache, CACHE_KEYS, CACHE_TTL, debouncedFetch } from 'src/utils/cache'
import LZRStake from './LZRStake'

interface IBridgeStake {}

const BridgeStake: FC<IBridgeStake> = () => {
  const { address, chainId } = useAccount()
  const [isStaking, setIsStaking] = useState(false)
  const [isUnstaking, setIsUnstaking] = useState(false)
  const [refreshData, setRefreshData] = useState(0)
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake')
  const [showDetails, setShowDetails] = useState(true)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [minimumAmount, setMinimumAmount] = useState(0.00000001) // Default fallback
  const [minimumAmountFormatted, setMinimumAmountFormatted] = useState('Amount must be greater than 0.00000001')

  // Get user's wallet balance (native lzrBTC on Bitlazer)
  const { data: walletBalance, refetch: refetchWalletBalance } = useBalance({
    address: address,
    chainId: mainnet.id,
  })

  // Get user's staked balance (StakeAdapter balance - represents staked tokens)
  const { data: stakedBalance, refetch: refetchStakedBalance } = useReadContract({
    abi: stakeAdapter_abi,
    address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
    functionName: 'balanceOf',
    args: address ? [address] : ['0x0000000000000000000000000000000000000000'],
    chainId: mainnet.id,
    scopeKey: refreshData.toString(),
  })

  // Get pending rewards
  const { data: pendingRewards, refetch: refetchPendingRewards } = useReadContract({
    abi: stakeAdapter_abi,
    address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
    functionName: 'pendingReward',
    args: address ? [address] : ['0x0000000000000000000000000000000000000000'],
    chainId: mainnet.id,
    scopeKey: refreshData.toString(),
  })

  // Get APR
  const { data: apr } = useReadContract({
    abi: stakeAdapter_abi,
    address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
    functionName: 'getApy',
    args: [],
    chainId: mainnet.id,
  })

  // Get total staked (total supply of adapter tokens)
  const { data: totalStaked } = useReadContract({
    abi: stakeAdapter_abi,
    address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
    functionName: 'totalSupply',
    chainId: mainnet.id,
    scopeKey: refreshData.toString(),
  })

  const {
    handleSubmit: handleStakeSubmit,
    control: stakeControl,
    watch: stakeWatch,
    setValue: stakeSetValue,
    trigger: stakeTrigger,
    formState: { errors: stakeErrors, isValid: isStakeValid },
  } = useForm({
    defaultValues: {
      stakeAmount: '',
    },
    mode: 'onChange',
  })

  const {
    handleSubmit: handleUnstakeSubmit,
    control: unstakeControl,
    watch: unstakeWatch,
    setValue: unstakeSetValue,
    trigger: unstakeTrigger,
    formState: { errors: unstakeErrors, isValid: isUnstakeValid },
  } = useForm({
    defaultValues: {
      unstakeAmount: '',
    },
    mode: 'onChange',
  })

  // Fetch BTC price and calculate minimum amount
  useEffect(() => {
    const fetchBTCPrice = async () => {
      try {
        const data = await fetchWithCache(
          CACHE_KEYS.BTC_PRICE,
          async () => {
            return debouncedFetch(CACHE_KEYS.BTC_PRICE, async () => {
              const response = await fetch(
                'https://api.coingecko.com/api/v3/simple/price?ids=wrapped-bitcoin&vs_currencies=usd&include_24hr_change=true',
              )
              if (!response.ok) throw new Error('Failed to fetch price')
              return response.json()
            })
          },
          { ttl: CACHE_TTL.PRICE },
        )

        const wbtcPrice = data['wrapped-bitcoin']?.usd || 0

        // Calculate minimum amount equivalent to $0.01
        if (wbtcPrice > 0) {
          const minAmount = 0.01 / wbtcPrice
          const roundedMinAmount = Math.ceil(minAmount * 100000000) / 100000000 // Round up to 8 decimals
          setMinimumAmount(roundedMinAmount)
          setMinimumAmountFormatted('Amount must be greater than $0.01')
        }
      } catch (error) {
        console.error('Error fetching BTC price:', error)
      }
    }

    fetchBTCPrice()
    const interval = setInterval(fetchBTCPrice, 30000) // Update every 30s
    return () => clearInterval(interval)
  }, [])

  const onStakeSubmit = async (data: any) => {
    setIsStaking(true)
    try {
      const amountToStake = parseUnits(data.stakeAmount, 18)

      // Execute the transaction with explicit gas to bypass estimation
      const txHash = await writeContract(config, {
        abi: stakeAdapter_abi,
        address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
        functionName: 'stake',
        args: [amountToStake],
        value: amountToStake, // For native token staking
        chainId: mainnet.id,
        account: address as `0x${string}`,
        gas: 300000n, // Provide explicit gas limit to bypass estimation
      } as any)

      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
      })

      if (receipt.status === 'success') {
        const wasRestaking = stakedBalance && Number(formatStakedAmount(stakedBalance as any)) > 0
        const message = wasRestaking
          ? `Successfully staked ${data.stakeAmount} lzrBTC. Previous rewards have been claimed!`
          : `Successfully staked ${data.stakeAmount} lzrBTC!`
        toast(<TXToast {...{ message, txHash: receipt.transactionHash }} />, { autoClose: 7000 })
        stakeSetValue('stakeAmount', '')
        setRefreshData((prev) => prev + 1)
        setTimeout(() => {
          refetchWalletBalance()
          refetchStakedBalance()
          refetchPendingRewards()
        }, 1000)
      } else {
        toast(<TXToast {...{ message: 'Stake failed' }} />, { autoClose: 7000 })
      }
    } catch (error: any) {
      console.error('Staking error:', error)
      // Log detailed error info for debugging
      if (error?.cause) {
        console.error('Error cause:', error.cause)
      }
      // Check if user rejected the transaction
      if (error?.message?.includes('User rejected') || error?.message?.includes('User denied')) {
        toast(<TXToast {...{ message: 'Transaction rejected by user' }} />, { autoClose: 7000 })
      } else {
        // Extract meaningful error message
        let errorMessage = 'Failed to stake'
        if (error?.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas'
        } else if (error?.shortMessage) {
          errorMessage = error.shortMessage
        } else if (error?.message) {
          // Get first line of error message
          errorMessage = error.message.split('\n')[0].substring(0, 100)
        }
        toast(<TXToast {...{ message: errorMessage }} />, { autoClose: 7000 })
      }
    } finally {
      setIsStaking(false)
    }
  }

  const onUnstakeSubmit = async (data: any) => {
    setIsUnstaking(true)
    try {
      const amountToUnstake = parseUnits(data.unstakeAmount, 18)

      // Execute the transaction with explicit gas to bypass estimation
      // NOTE: MetaMask will show "0 lzrBTC" for unstaking transactions because it only displays
      // the transaction value (which is 0), not the function parameter amount. This is a MetaMask
      // limitation - the actual unstake amount is encoded in the function args.
      const txHash = await writeContract(config, {
        abi: stakeAdapter_abi,
        address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
        functionName: 'unstake',
        args: [amountToUnstake],
        value: 0n, // Explicitly set value to 0 for payable function
        chainId: mainnet.id,
        account: address as `0x${string}`,
        gas: 300000n, // Provide explicit gas limit to bypass estimation
      } as any)

      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
      })

      if (receipt.status === 'success') {
        toast(
          <TXToast
            {...{
              message: `Successfully unstaked ${data.unstakeAmount} lzrBTC. Rewards have been automatically claimed!`,
              txHash: receipt.transactionHash,
            }}
          />,
          { autoClose: 7000 },
        )
        unstakeSetValue('unstakeAmount', '')
        setRefreshData((prev) => prev + 1)
        setTimeout(() => {
          refetchWalletBalance()
          refetchStakedBalance()
          refetchPendingRewards()
        }, 1000)
      } else {
        toast(<TXToast {...{ message: 'Unstake failed' }} />, { autoClose: 7000 })
      }
    } catch (error: any) {
      console.error('Unstaking error:', error)
      // Log detailed error info for debugging
      if (error?.cause) {
        console.error('Error cause:', error.cause)
      }
      // Check if user rejected the transaction
      if (error?.message?.includes('User rejected') || error?.message?.includes('User denied')) {
        toast(<TXToast {...{ message: 'Transaction rejected by user' }} />, { autoClose: 7000 })
      } else if (error?.message?.includes('Insufficient balance for rewards')) {
        // Contract doesn't have enough balance to pay rewards
        toast(
          <TXToast
            {...{
              message:
                'Unable to unstake: The staking pool currently has insufficient funds for reward payouts. Please try again later or contact support.',
            }}
          />,
          { autoClose: 7000 },
        )
      } else {
        // Extract meaningful error message
        let errorMessage = 'Failed to unstake'
        if (error?.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas'
        } else if (error?.shortMessage) {
          errorMessage = error.shortMessage
        } else if (error?.message) {
          // Get first line of error message
          errorMessage = error.message.split('\n')[0].substring(0, 100)
        }
        toast(<TXToast {...{ message: errorMessage }} />, { autoClose: 7000 })
      }
    } finally {
      setIsUnstaking(false)
    }
  }

  const formatAPR = () => {
    if (!apr) return 'Loading...'
    try {
      // APR is returned as direct percentage value (not basis points)
      // getApy() returns 33333 which means 33,333%
      const aprNumber = Number(apr)
      return `${aprNumber.toLocaleString()}%`
    } catch {
      return 'Variable'
    }
  }

  const formatStakedAmount = (value: any) => {
    if (!value) return '0'
    try {
      return formatEther(value.toString())
    } catch {
      return '0'
    }
  }

  const formatRewardAmount = (value: any) => {
    if (!value || value === 0n) return '0'
    try {
      // Format without rounding to show all decimal places
      const formatted = formatEther(value.toString())
      const num = parseFloat(formatted)
      // Show up to 18 decimal places, removing trailing zeros
      if (num === 0) return '0'
      // For very small numbers, show up to 18 decimals
      if (num < 0.000001) {
        return formatted // Show the full precision
      }
      // For larger numbers, show up to 8 decimals
      return num.toFixed(8).replace(/\.?0+$/, '')
    } catch {
      return '0'
    }
  }

  const handlePercentage = (percentage: number) => {
    const balance =
      activeTab === 'stake'
        ? walletBalance
          ? formatEther(walletBalance.value.toString())
          : '0'
        : formatStakedAmount(stakedBalance)

    const amount =
      percentage === 100
        ? (parseFloat(balance) * 0.999999).toString()
        : (parseFloat(balance) * (percentage / 100)).toString()

    if (activeTab === 'stake') {
      stakeSetValue('stakeAmount', amount)
      stakeTrigger('stakeAmount')
    } else {
      unstakeSetValue('unstakeAmount', amount)
      unstakeTrigger('unstakeAmount')
    }
  }

  // Render Stake Tab
  const renderStakeTab = () => (
    <div className="space-y-6 w-full">
      {/* Big Card with integrated tabs */}
      <div className="w-full">
        <div className="relative bg-darkslategray-200 border border-lightgreen-100 rounded-[.115rem] overflow-hidden">
          {/* Mini Tabs - Full width, inside the card as header */}
          <div className="grid grid-cols-2 bg-darkslategray-200 border-b border-lightgreen-100/20">
            <button
              onClick={() => setActiveTab('stake')}
              className={clsx(
                'font-ocrx w-full cursor-pointer py-2 text-lightgreen-100 text-lg uppercase tracking-wider transition-all duration-300 border-b-2',
                activeTab === 'stake'
                  ? 'bg-darkslategray-100 border-lightgreen-100'
                  : 'bg-darkslategray-200/70 hover:bg-darkslategray-200/90 border-transparent',
              )}
            >
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 bg-lightgreen-100 rounded-full flex items-center justify-center text-[10px] font-bold text-black">
                  1
                </div>
                STAKE
              </span>
            </button>
            <button
              onClick={() => setActiveTab('unstake')}
              className={clsx(
                'font-ocrx w-full cursor-pointer py-2 text-lightgreen-100 text-lg uppercase tracking-wider transition-all duration-300 border-b-2',
                activeTab === 'unstake'
                  ? 'bg-darkslategray-100 border-lightgreen-100'
                  : 'bg-darkslategray-200/70 hover:bg-darkslategray-200/90 border-transparent',
              )}
            >
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 bg-lightgreen-100 rounded-full flex items-center justify-center text-[10px] font-bold text-black">
                  2
                </div>
                UNSTAKE
              </span>
            </button>
          </div>

          {/* Card Content */}
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/70 text-sm font-maison-neue">Available Amount</span>
              {/* Percentage buttons and Balance */}
              <div className="relative h-6 flex items-center justify-end">
                {isInputFocused ? (
                  <div className="flex items-center gap-1 animate-fadeIn">
                    <button
                      type="button"
                      onClick={() => handlePercentage(25)}
                      className="px-2 py-1 text-xs font-bold text-lightgreen-100 hover:bg-lightgreen-100/10 rounded transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePercentage(50)}
                      className="px-2 py-1 text-xs font-bold text-lightgreen-100 hover:bg-lightgreen-100/10 rounded transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePercentage(100)}
                      className="px-2 py-1 text-xs font-bold text-lightgreen-100 hover:bg-lightgreen-100/10 rounded transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      MAX
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePercentage(100)}
                    className="flex items-center gap-2 hover:scale-105 active:scale-95 cursor-pointer animate-fadeIn"
                  >
                    {/* Wallet icon */}
                    <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                    </svg>
                    <span className="text-white/50 text-xs font-maison-neue">
                      {walletBalance ? formatEther(walletBalance.value.toString()) : '0'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Token and Amount container */}
            <div
              className={clsx(
                'bg-black/40 rounded-lg p-3 border transition-all duration-150',
                isInputFocused
                  ? 'border-lightgreen-100 shadow-[0_0_12px_rgba(102,213,96,0.25)] scale-[1.01]'
                  : 'border-lightgreen-100/20 hover:border-lightgreen-100/40',
              )}
            >
              <div className="flex items-center justify-between">
                {/* Token Display */}
                <div className="flex items-center gap-2">
                  <img
                    src="/icons/crypto/bitcoin.svg"
                    alt="lzrBTC"
                    className="w-8 h-8 flex-shrink-0 transition-transform duration-300 hover:rotate-12"
                  />
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-base transition-colors duration-200">lzrBTC</span>
                    <span className="text-white/50 text-xs">Bitlazer L3</span>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="flex flex-col items-end flex-1 min-w-0">
                  <Controller
                    key="stake-amount"
                    name="stakeAmount"
                    control={stakeControl}
                    rules={{
                      required: 'Amount is required',
                      min: { value: minimumAmount, message: minimumAmountFormatted },
                      max: {
                        value: parseFloat(walletBalance ? formatEther(walletBalance.value.toString()) : '0'),
                        message: 'Insufficient balance',
                      },
                    }}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        placeholder="0"
                        className={clsx(
                          'bg-transparent text-white text-xl font-bold placeholder:text-white/30',
                          'focus:outline-none text-right w-full overflow-hidden text-ellipsis',
                        )}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      />
                    )}
                  />
                  <div className="text-white/40 text-xs mt-1 truncate w-full text-right">APR: {formatAPR()}</div>
                </div>
              </div>
            </div>

            {/* Staking Overview Dropdown - Inside the main card */}
            <div className="mt-4 pt-3 border-t border-lightgreen-100/20">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between transition-all duration-200"
              >
                <span className="text-white/70 text-sm font-maison-neue">Staking Overview</span>
                <svg
                  className={clsx(
                    'w-4 h-4 text-white/50 transition-transform duration-200',
                    showDetails ? 'rotate-180' : '',
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Collapsible Details with smooth transition like Bridge Details */}
              <div
                className={clsx('overflow-hidden transition-all duration-300', showDetails ? 'max-h-96' : 'max-h-0')}
              >
                <div className="pt-2 space-y-1.5 border-t border-lightgreen-100/20">
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-white/50 text-xs font-maison-neue">Your Stake</span>
                    <span className="text-white text-xs font-maison-neue">
                      {formatStakedAmount(stakedBalance)} lzrBTC
                    </span>
                  </div>

                  <div className="h-px bg-lightgreen-100/10"></div>

                  <div className="flex justify-between items-center">
                    <span className="text-white/50 text-xs font-maison-neue">Pending Rewards</span>
                    <span className="text-white text-xs font-maison-neue">
                      {formatRewardAmount(pendingRewards)} lzrBTC
                    </span>
                  </div>

                  <div className="h-px bg-lightgreen-100/10"></div>

                  <div className="flex justify-between items-center">
                    <span className="text-white/50 text-xs font-maison-neue">APR</span>
                    <span className="text-white text-xs font-maison-neue">{formatAPR()}</span>
                  </div>

                  <div className="h-px bg-lightgreen-100/10"></div>

                  <div className="flex justify-between items-center">
                    <span className="text-white/50 text-xs font-maison-neue">Total Pool Size</span>
                    <span className="text-white text-xs font-maison-neue">
                      {formatStakedAmount(totalStaked)} lzrBTC
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {stakeErrors.stakeAmount && (
        <div className="text-red-500 text-sm w-full mt-2 mb-2">{stakeErrors.stakeAmount?.message}</div>
      )}

      {/* Action Button */}
      <div className="w-full">
        {chainId === mainnet.id ? (
          <form onSubmit={handleStakeSubmit(onStakeSubmit)}>
            <Button
              type="submit"
              disabled={!isStakeValid || !stakeWatch('stakeAmount') || isStaking}
              aria-busy={isStaking}
            >
              {isStaking ? <Loading text="STAKING" /> : 'STAKE'}
            </Button>
          </form>
        ) : (
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              handleChainSwitch(true)
            }}
          >
            SWITCH TO BITLAZER
          </Button>
        )}
      </div>
    </div>
  )

  // Render Unstake Tab
  const renderUnstakeTab = () => (
    <div className="space-y-6 w-full">
      {/* Big Card with integrated tabs */}
      <div className="w-full">
        <div className="relative bg-darkslategray-200 border border-lightgreen-100 rounded-[.115rem] overflow-hidden">
          {/* Mini Tabs - Full width, inside the card as header */}
          <div className="grid grid-cols-2 bg-darkslategray-200 border-b border-lightgreen-100/20">
            <button
              onClick={() => setActiveTab('stake')}
              className={clsx(
                'font-ocrx w-full cursor-pointer py-2 text-lightgreen-100 text-lg uppercase tracking-wider transition-all duration-300 border-b-2',
                activeTab === 'stake'
                  ? 'bg-darkslategray-100 border-lightgreen-100'
                  : 'bg-darkslategray-200/70 hover:bg-darkslategray-200/90 border-transparent',
              )}
            >
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 bg-lightgreen-100 rounded-full flex items-center justify-center text-[10px] font-bold text-black">
                  1
                </div>
                STAKE
              </span>
            </button>
            <button
              onClick={() => setActiveTab('unstake')}
              className={clsx(
                'font-ocrx w-full cursor-pointer py-2 text-lightgreen-100 text-lg uppercase tracking-wider transition-all duration-300 border-b-2',
                activeTab === 'unstake'
                  ? 'bg-darkslategray-100 border-lightgreen-100'
                  : 'bg-darkslategray-200/70 hover:bg-darkslategray-200/90 border-transparent',
              )}
            >
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 bg-lightgreen-100 rounded-full flex items-center justify-center text-[10px] font-bold text-black">
                  2
                </div>
                UNSTAKE
              </span>
            </button>
          </div>

          {/* Card Content */}
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/70 text-sm font-maison-neue">Staked Amount</span>
              {/* Percentage buttons and Balance */}
              <div className="relative h-6 flex items-center justify-end">
                {isInputFocused ? (
                  <div className="flex items-center gap-1 animate-fadeIn">
                    <button
                      type="button"
                      onClick={() => handlePercentage(25)}
                      className="px-2 py-1 text-xs font-bold text-lightgreen-100 hover:bg-lightgreen-100/10 rounded transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePercentage(50)}
                      className="px-2 py-1 text-xs font-bold text-lightgreen-100 hover:bg-lightgreen-100/10 rounded transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePercentage(100)}
                      className="px-2 py-1 text-xs font-bold text-lightgreen-100 hover:bg-lightgreen-100/10 rounded transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      MAX
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePercentage(100)}
                    className="flex items-center gap-2 hover:scale-105 active:scale-95 cursor-pointer animate-fadeIn"
                  >
                    {/* Wallet icon */}
                    <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                    </svg>
                    <span className="text-white/50 text-xs font-maison-neue">{formatStakedAmount(stakedBalance)}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Token and Amount container */}
            <div
              className={clsx(
                'bg-black/40 rounded-lg p-3 border transition-all duration-150',
                isInputFocused
                  ? 'border-lightgreen-100 shadow-[0_0_12px_rgba(102,213,96,0.25)] scale-[1.01]'
                  : 'border-lightgreen-100/20 hover:border-lightgreen-100/40',
              )}
            >
              <div className="flex items-center justify-between">
                {/* Token Display */}
                <div className="flex items-center gap-2">
                  <img
                    src="/icons/crypto/bitcoin.svg"
                    alt="Staked lzrBTC"
                    className="w-8 h-8 flex-shrink-0 transition-transform duration-300 hover:rotate-12"
                  />
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-base transition-colors duration-200">Staked lzrBTC</span>
                    <span className="text-white/50 text-xs">Bitlazer L3</span>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="flex flex-col items-end flex-1 min-w-0">
                  <Controller
                    key="unstake-amount"
                    name="unstakeAmount"
                    control={unstakeControl}
                    rules={{
                      required: 'Amount is required',
                      min: { value: minimumAmount, message: minimumAmountFormatted },
                      max: {
                        value: parseFloat(formatStakedAmount(stakedBalance)),
                        message: 'Insufficient staked balance',
                      },
                    }}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        placeholder="0"
                        className={clsx(
                          'bg-transparent text-white text-xl font-bold placeholder:text-white/30',
                          'focus:outline-none text-right w-full overflow-hidden text-ellipsis',
                        )}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      />
                    )}
                  />
                  <div className="text-white/40 text-xs mt-1 truncate w-full text-right">
                    Rewards: {formatRewardAmount(pendingRewards)} lzrBTC
                  </div>
                </div>
              </div>
            </div>

            {/* Staking Overview Dropdown - Inside the main card */}
            <div className="mt-4 pt-3 border-t border-lightgreen-100/20">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between transition-all duration-200"
              >
                <span className="text-white/70 text-sm font-maison-neue">Staking Overview</span>
                <svg
                  className={clsx(
                    'w-4 h-4 text-white/50 transition-transform duration-200',
                    showDetails ? 'rotate-180' : '',
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Collapsible Details with smooth transition like Bridge Details */}
              <div
                className={clsx('overflow-hidden transition-all duration-300', showDetails ? 'max-h-96' : 'max-h-0')}
              >
                <div className="pt-2 space-y-1.5 border-t border-lightgreen-100/20">
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-white/50 text-xs font-maison-neue">Your Stake</span>
                    <span className="text-white text-xs font-maison-neue">
                      {formatStakedAmount(stakedBalance)} lzrBTC
                    </span>
                  </div>

                  <div className="h-px bg-lightgreen-100/10"></div>

                  <div className="flex justify-between items-center">
                    <span className="text-white/50 text-xs font-maison-neue">Pending Rewards</span>
                    <span className="text-white text-xs font-maison-neue">
                      {formatRewardAmount(pendingRewards)} lzrBTC
                    </span>
                  </div>

                  <div className="h-px bg-lightgreen-100/10"></div>

                  <div className="flex justify-between items-center">
                    <span className="text-white/50 text-xs font-maison-neue">APR</span>
                    <span className="text-white text-xs font-maison-neue">{formatAPR()}</span>
                  </div>

                  <div className="h-px bg-lightgreen-100/10"></div>

                  <div className="flex justify-between items-center">
                    <span className="text-white/50 text-xs font-maison-neue">Total Pool Size</span>
                    <span className="text-white text-xs font-maison-neue">
                      {formatStakedAmount(totalStaked)} lzrBTC
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {unstakeErrors.unstakeAmount && (
        <div className="text-red-500 text-sm w-full mt-2 mb-2">{unstakeErrors.unstakeAmount?.message}</div>
      )}

      {/* Action Button */}
      <div className="w-full">
        {chainId === mainnet.id ? (
          <form onSubmit={handleUnstakeSubmit(onUnstakeSubmit)}>
            <Button
              type="submit"
              disabled={!isUnstakeValid || !unstakeWatch('unstakeAmount') || isUnstaking}
              aria-busy={isUnstaking}
            >
              {isUnstaking ? <Loading text="UNSTAKING" /> : 'UNSTAKE'}
            </Button>
          </form>
        ) : (
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              handleChainSwitch(true)
            }}
          >
            SWITCH TO BITLAZER
          </Button>
        )}

        <p className="text-gray-200 text-sm text-left mt-2">* Unstaking will automatically claim your rewards</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Show LZRStake component if Advanced mode is active */}
      {showAdvanced ? (
        <LZRStake onBack={() => setShowAdvanced(false)} />
      ) : (
        <>
          {/* Title & Description - Always visible */}
          <div className="flex flex-col gap-4 mb-6 text-2xl font-ocrx">
            <div className="flex items-center justify-between w-full">
              <div className="text-2xl">
                <span>[ </span>
                <span className="text-lightgreen-100">{activeTab === 'stake' ? 'Step 3' : 'Step 4'}</span>
                <span> | </span>
                <span className="text-fuchsia">
                  {activeTab === 'stake' ? 'Stake and Earn Yield' : 'Unstake and Collect Rewards'}
                </span>
                <span> ] </span>
              </div>
              {/* Coming Soon Button */}
              <button
                onClick={() => setShowAdvanced(true)}
                className="px-3 py-1.5 bg-transparent hover:bg-lightgreen-100/10 border border-lightgreen-100/50 hover:border-lightgreen-100 transition-all rounded-[.115rem] text-lightgreen-100 font-ocrx uppercase text-base tracking-wider flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
                Coming Soon
              </button>
            </div>
            <div className="tracking-[-0.06em] leading-[1.313rem]">
              {activeTab === 'stake'
                ? 'Stake your lzrBTC on Bitlazer to earn dual yield: native Bitcoin gas rewards + LZR tokens.'
                : 'Unstake anytime to claim your lzrBTC + rewards. Bridge back and unwrap to WBTC.'}
            </div>
          </div>

          {/* Tab Content with integrated mini tabs */}
          {activeTab === 'stake' ? renderStakeTab() : renderUnstakeTab()}
        </>
      )}
    </div>
  )
}

export default BridgeStake
