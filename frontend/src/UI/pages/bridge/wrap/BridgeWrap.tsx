import { Button, TXToast } from '@components/index'
import Loading from '@components/loading/Loading'
import React, { FC, useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useAccount, useBalance, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { waitForTransactionReceipt, writeContract, simulateContract } from '@wagmi/core'
import { arbitrum } from 'wagmi/chains'
import { config } from 'src/web3/config'
import { ERC20_CONTRACT_ADDRESS, TokenKeys, WRAP_CONTRACT } from 'src/web3/contracts'
import { lzrBTC_abi } from 'src/assets/abi/lzrBTC'
import { toast } from 'react-toastify'
import { parseUnits } from 'viem'
import Cookies from 'universal-cookie'
import { handleChainSwitch } from 'src/web3/functions'
import clsx from 'clsx'
import { fetchWithCache, CACHE_KEYS, CACHE_TTL, debouncedFetch } from 'src/utils/cache'
import { useNavigate } from 'react-router-dom'
import { useWrapDetails } from 'src/hooks/useWrapDetails'

interface IBridgeWrap {}

const BridgeWrap: FC<IBridgeWrap> = () => {
  const navigate = useNavigate()

  // Helper to safely parse amounts with proper decimal truncation
  const safeParseUnits = (amount: string, decimals: number) => {
    const truncatedAmount = parseFloat(amount).toFixed(decimals)
    return parseUnits(truncatedAmount, decimals)
  }
  const [selectedToken] = useState<TokenKeys>('wbtc')
  const [selectedTokenUnwrap] = useState<TokenKeys>('wbtc')
  const [isWrapMode, setIsWrapMode] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const [btcPrice, setBtcPrice] = useState(0)
  const [isInputFocused, setIsInputFocused] = useState(false)

  // Dynamic wrap details
  const wrapDetails = useWrapDetails()

  const { address, chainId } = useAccount()
  const [approval, setApproval] = useState<boolean>(false)
  const [refresh, setRefresh] = useState<boolean>(false)
  const [, setHolderBalance] = useState<string | undefined>(undefined)
  const [isApproving, setIsApproving] = useState<boolean>(false)
  const [isWrapping, setIsWrapping] = useState<boolean>(false)
  const [isUnwrapping, setIsUnwrapping] = useState<boolean>(false)

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    getValues,
    trigger,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      amount: '',
    },
    mode: 'onChange',
  })

  const {
    control: unwrapControl,
    handleSubmit: handleSubmitUnwrap,
    setValue: unwrapSetValue,
    watch: unwrapWatch,
    getValues: unwrapGetValues,
    trigger: unwrapTrigger,
    formState: { errors: unwrapErrors, isValid: isUnwrapValid },
  } = useForm({
    defaultValues: {
      amount: '',
    },
    mode: 'onChange',
  })

  // Fetch BTC price from CoinGecko
  useEffect(() => {
    const fetchBTCPrice = async () => {
      try {
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
      }
    }

    fetchBTCPrice()
    const interval = setInterval(fetchBTCPrice, 30000) // Update every 30s
    return () => clearInterval(interval)
  }, [])

  const { data: balanceData, isLoading: balanceLoading } = useBalance({
    address,
    token: ERC20_CONTRACT_ADDRESS[selectedToken],
    chainId: arbitrum.id,
    scopeKey: refresh.toString(),
  })

  const { data: lzrBTCBalanceData, isLoading: lzrBTCBalanceLoading } = useBalance({
    address,
    token: ERC20_CONTRACT_ADDRESS['lzrBTC'],
    chainId: arbitrum.id,
    scopeKey: refresh.toString(),
  })

  useBalance({
    address,
    token: ERC20_CONTRACT_ADDRESS['wbtc'],
    chainId: arbitrum.id,
    scopeKey: refresh.toString(),
  })

  const { data: approvalData, isLoading: isLoadingApproval } = useReadContract({
    abi: erc20Abi,
    address: ERC20_CONTRACT_ADDRESS[selectedToken],
    functionName: 'allowance',
    args: [address || '0x', WRAP_CONTRACT],
    chainId: arbitrum.id,
    scopeKey: refresh.toString(),
  })

  // For reverse approval (not used currently)
  useReadContract({
    abi: erc20Abi,
    address: WRAP_CONTRACT,
    functionName: 'allowance',
    args: [address || '0x', ERC20_CONTRACT_ADDRESS[selectedToken]],
    chainId: arbitrum.id,
    scopeKey: refresh.toString(),
  })

  // getHolderBalance

  const { data: wbtcHolderBalance } = useReadContract({
    abi: lzrBTC_abi,
    address: WRAP_CONTRACT,
    functionName: 'getHolderBalance',
    args: [address || '0x', ERC20_CONTRACT_ADDRESS['wbtc']],
    chainId: arbitrum.id,
    scopeKey: refresh.toString(),
  })

  // Check if contract is paused (not used in UI currently)
  useReadContract({
    abi: [
      {
        inputs: [],
        name: 'paused',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    address: WRAP_CONTRACT,
    functionName: 'paused',
    chainId: arbitrum.id,
  })

  // Check decimals conversion flag
  const { data: decimalsConversion } = useReadContract({
    abi: [
      {
        inputs: [],
        name: '__apply8To18DecimalsConversion',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    address: WRAP_CONTRACT,
    functionName: '__apply8To18DecimalsConversion',
    chainId: arbitrum.id,
  })

  // Check if WBTC is set as supported wrapper (not used in UI currently)
  useReadContract({
    abi: [
      {
        inputs: [{ internalType: 'address', name: '', type: 'address' }],
        name: 'supportedWrappers',
        outputs: [{ internalType: 'contract IERC20', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    address: WRAP_CONTRACT,
    functionName: 'supportedWrappers',
    args: [ERC20_CONTRACT_ADDRESS['wbtc'] as `0x${string}`],
    chainId: arbitrum.id,
  })

  useEffect(() => {
    if (selectedTokenUnwrap === 'wbtc') {
      setHolderBalance(wbtcHolderBalance as string)
    }
  }, [selectedTokenUnwrap, wbtcHolderBalance])

  useEffect(() => {
    if (approvalData !== undefined) {
      const amount = getValues('amount') || '0'

      // If no amount entered, always show APPROVE
      if (!amount || amount === '0') {
        setApproval(false)
        return
      }

      let requiredApproval: bigint
      try {
        if (selectedToken === 'wbtc') {
          // Contract expects 8 decimals for WBTC
          requiredApproval = safeParseUnits(amount, 8)
        } else {
          requiredApproval = safeParseUnits(amount, 18)
        }

        // approvalData is already a bigint from the contract read
        if (BigInt(approvalData) >= requiredApproval) {
          setApproval(true)
        } else {
          setApproval(false)
        }
      } catch (error) {
        // Invalid amount format - show APPROVE
        setApproval(false)
      }
    }
  }, [approvalData, watch('amount'), refresh, selectedToken])

  const handleApprove = async () => {
    setIsApproving(true)
    const amount = getValues('amount')

    let amountForApproval: bigint
    if (selectedToken === 'wbtc') {
      amountForApproval = safeParseUnits(amount, 8)
    } else {
      amountForApproval = safeParseUnits(amount, 18)
    }

    const approvalArgs = {
      abi: erc20Abi,
      address: ERC20_CONTRACT_ADDRESS[selectedToken] as `0x${string}`,
      functionName: 'approve' as const,
      args: [WRAP_CONTRACT as `0x${string}`, amountForApproval] as const,
    }

    let approvalTransactionHash
    try {
      approvalTransactionHash = await writeContract(config, approvalArgs)
    } catch (error: any) {
      // Check if user rejected the transaction
      if (error?.message?.includes('User rejected') || error?.message?.includes('User denied')) {
        toast(<TXToast {...{ message: 'Transaction rejected by user' }} />, { autoClose: 7000 })
      } else {
        toast(<TXToast {...{ message: 'Approval failed', error }} />, { autoClose: 7000 })
      }
      setIsApproving(false)
      return
    }
    const approvalReceipt = await waitForTransactionReceipt(config, {
      hash: approvalTransactionHash,
    })

    if (approvalReceipt.status === 'success') {
      const txHash = approvalReceipt.transactionHash
      toast(<TXToast {...{ message: 'Approval successful', txHash }} />, { autoClose: 7000 })
      setApproval(true)
      // Trigger refresh to update allowance
      setRefresh((prev) => !prev)
    } else {
      toast(<TXToast {...{ message: 'Transaction failed' }} />, { autoClose: 7000 })
      setApproval(false)
    }
    setIsApproving(false)
  }

  const handleDeposit = async () => {
    setIsWrapping(true)
    const amount = getValues('amount')
    let amountToSend: bigint
    if (selectedToken === 'wbtc') {
      amountToSend = safeParseUnits(amount, 8)
    } else {
      amountToSend = safeParseUnits(amount, 18)
    }

    const args = {
      abi: lzrBTC_abi,
      address: WRAP_CONTRACT as `0x${string}`,
      functionName: 'mint' as const,
      args: [amountToSend] as const,
    }

    try {
      try {
        await simulateContract(config, {
          ...args,
          account: address as `0x${string}`,
        })
      } catch (simulationError: any) {
        if (simulationError.message?.includes('Wrapper not supported')) {
          toast(<TXToast {...{ message: 'WBTC is not configured as a supported wrapper' }} />, { autoClose: 7000 })
          setIsWrapping(false)
          return
        }
        if (simulationError.message?.includes('paused')) {
          toast(<TXToast {...{ message: 'Contract is paused' }} />, { autoClose: 7000 })
          setIsWrapping(false)
          return
        }
        if (simulationError.message?.includes('Insufficient')) {
          toast(<TXToast {...{ message: 'Insufficient WBTC balance' }} />, { autoClose: 7000 })
          setIsWrapping(false)
          return
        }

        toast(<TXToast {...{ message: `Transaction will fail: ${simulationError.message || 'Unknown error'}` }} />, {
          autoClose: 7000,
        })
        setIsWrapping(false)
        return
      }

      const transactionHash = await writeContract(config, args)

      const receipt = await waitForTransactionReceipt(config, {
        hash: transactionHash,
      })

      if (receipt.status === 'success') {
        const txHash = receipt.transactionHash
        toast(<TXToast {...{ message: 'Wrap successful', txHash }} />, { autoClose: 7000 })
        const cookies = new Cookies()
        cookies.set('hasWrapped', 'true', { path: '/' })
        // Clear the input field and reset approval after successful wrap
        setValue('amount', '')
        setApproval(false)
        // Single refresh after successful transaction
        setRefresh((prev) => !prev)

        // Only redirect to crosschain after wrapping WBTC to lzrBTC
        // This is wrap mode and we just successfully wrapped
        setTimeout(() => {
          navigate('/bridge/crosschain')
        }, 1500)
      } else {
        toast(<TXToast {...{ message: 'Wrap failed' }} />, { autoClose: 7000 })
      }
      setIsWrapping(false)
    } catch (error: any) {
      setIsWrapping(false)
      if (!error.message.includes('User rejected the request.')) {
        toast(<TXToast {...{ message: 'Failed to Wrap.' }} />, { autoClose: 7000 })
      } else {
        toast(<TXToast {...{ message: 'Transaction Rejected.' }} />, { autoClose: 7000 })
      }
    }
  }

  const handleUnwrap = async () => {
    setIsUnwrapping(true)
    const amount = unwrapGetValues('amount')
    let amountToSend: bigint

    if (selectedTokenUnwrap === 'wbtc') {
      amountToSend = safeParseUnits(amount, 18)
    } else {
      amountToSend = safeParseUnits(amount, 18)
    }

    const args = {
      abi: lzrBTC_abi,
      address: WRAP_CONTRACT as `0x${string}`,
      functionName: 'burn' as const,
      args: [amountToSend] as const,
    }

    try {
      const transactionHash = await writeContract(config, args)
      const receipt = await waitForTransactionReceipt(config, {
        hash: transactionHash,
      })

      if (receipt.status === 'success') {
        const txHash = receipt.transactionHash
        toast(<TXToast {...{ message: 'Unwrap successful', txHash }} />, { autoClose: 7000 })
        // Clear the input field after successful unwrap
        unwrapSetValue('amount', '')
        // Single refresh after successful transaction
        setRefresh((prev) => !prev)
      } else {
        toast(<TXToast {...{ message: 'Unwrap failed' }} />, { autoClose: 7000 })
      }
      setIsUnwrapping(false)
    } catch (error: any) {
      setIsUnwrapping(false)
      if (!error.message.includes('User rejected the request.')) {
        toast(<TXToast {...{ message: 'Failed to Unwrap' }} />, { autoClose: 7000 })
      } else {
        toast(<TXToast {...{ message: 'Transaction Rejected.' }} />, { autoClose: 7000 })
      }
    }
  }

  const onSubmit = async () => {
    if (isWrapMode) {
      approval ? handleDeposit() : handleApprove()
    } else {
      handleUnwrap()
    }
  }

  const handleSwitch = () => {
    setIsWrapMode(!isWrapMode)
    // Clear forms when switching
    setValue('amount', '')
    unwrapSetValue('amount', '')
    setIsInputFocused(false)
  }

  // Calculate expected output (1:1 ratio)
  const expectedOutput = isWrapMode ? watch('amount') : unwrapWatch('amount')

  // Format USD value
  const formatUSDValue = (amount: string | undefined) => {
    if (!amount || !btcPrice) return '$0.00'
    const value = parseFloat(amount) * btcPrice
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Handle percentage buttons
  const handlePercentage = (percentage: number) => {
    const balance = isWrapMode ? balanceData?.formatted : lzrBTCBalanceData?.formatted
    if (balance) {
      // For MAX (100%), reduce slightly to avoid validation issues
      const multiplier = percentage === 100 ? 0.999999 : percentage / 100
      const value = (parseFloat(balance) * multiplier).toString()
      if (isWrapMode) {
        setValue('amount', value)
        trigger('amount')
      } else {
        unwrapSetValue('amount', value)
        unwrapTrigger('amount')
      }
    }
  }

  return (
    <form onSubmit={isWrapMode ? handleSubmit(onSubmit) : handleSubmitUnwrap(onSubmit)} className="flex flex-col">
      {/* Title & Description - Match exact styling from HOW IT WORKS section */}
      <div className="flex flex-col gap-4 mb-6 text-2xl font-ocrx">
        <div className="text-2xl">
          <span>[ </span>
          <span className="text-lightgreen-100">{isWrapMode ? 'Step 1' : 'Step 6'}</span>
          <span> | </span>
          <span className="text-fuchsia">{isWrapMode ? 'Convert WBTC to lzrBTC' : 'Unwrap lzrBTC to WBTC'}</span>
          <span> ] </span>
        </div>
        <div className="tracking-[-0.06em] leading-[1.313rem]">
          {isWrapMode
            ? 'Wrap your WBTC to lzrBTC on Arbitrum to be able to start staking and earning.'
            : 'Convert your lzrBTC back to WBTC. This includes your lzrBTC staking rewards.'}
        </div>
      </div>

      {/* Main Swap Container */}
      <div className="relative max-w-[28rem]">
        {/* From Card - No gradient background */}
        <div className="relative">
          <div className="relative bg-darkslategray-200 border border-lightgreen-100/50 hover:border-lightgreen-100 transition-all duration-300 rounded-[.115rem] p-4 overflow-visible">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/70 text-sm font-maison-neue">From</span>
              <div className="relative h-6 w-[160px] flex items-center justify-end">
                {/* Show percentage buttons when focused with fade transition */}
                <div
                  className={clsx(
                    'flex items-center gap-1 transition-opacity duration-200 z-10',
                    isInputFocused ? 'opacity-100' : 'opacity-0 pointer-events-none',
                  )}
                >
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
                {/* Balance display with fade transition */}
                <div
                  className={clsx(
                    'absolute right-0 flex items-center gap-2 transition-opacity duration-200',
                    !isInputFocused ? 'opacity-100' : 'opacity-0 pointer-events-none',
                  )}
                >
                  {/* Wallet icon */}
                  <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                  </svg>
                  <span className="text-white/50 text-xs font-maison-neue">
                    {isWrapMode
                      ? balanceLoading
                        ? '...'
                        : `${balanceData?.formatted || '0'}`
                      : lzrBTCBalanceLoading
                        ? '...'
                        : `${lzrBTCBalanceData?.formatted || '0'}`}
                  </span>
                </div>
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
                    alt={isWrapMode ? 'WBTC' : 'lzrBTC'}
                    className="w-8 h-8 flex-shrink-0 transition-transform duration-300 hover:rotate-12"
                  />
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-base transition-colors duration-200">
                      {isWrapMode ? 'WBTC' : 'lzrBTC'}
                    </span>
                    <span className="text-white/50 text-xs">Arbitrum One</span>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="flex flex-col items-end flex-1 min-w-0">
                  <Controller
                    key={isWrapMode ? 'wrap-amount' : 'unwrap-amount'}
                    name="amount"
                    control={isWrapMode ? control : unwrapControl}
                    rules={{
                      required: 'Amount is required',
                      min: { value: 0.00001, message: 'Amount must be greater than 0.00001' },
                      max: {
                        value: parseFloat(
                          isWrapMode ? balanceData?.formatted || '0' : lzrBTCBalanceData?.formatted || '0',
                        ),
                        message: 'Insufficient balance',
                      },
                    }}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        placeholder="0"
                        className={clsx(
                          'bg-transparent text-white text-2xl font-bold placeholder:text-white/30',
                          'focus:outline-none text-right w-full overflow-hidden text-ellipsis',
                        )}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      />
                    )}
                  />
                  {/* USD Value inside the card */}
                  <div className="text-white/40 text-xs mt-1 truncate w-full text-right">
                    ≈ {formatUSDValue(isWrapMode ? watch('amount') : unwrapWatch('amount'))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Switch Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            type="button"
            onClick={handleSwitch}
            className="bg-darkslategray-200 border-4 border-[#0a0a0a] rounded-[.115rem] p-2 hover:bg-darkslategray-200/80 transition-colors group"
          >
            <svg
              className="w-6 h-6 text-lightgreen-100 group-hover:rotate-180 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </button>
        </div>

        {/* To Card - No gradient background */}
        <div className="relative">
          <div className="relative bg-darkslategray-200 border border-lightgreen-100/50 hover:border-lightgreen-100 transition-all duration-300 rounded-[.115rem] p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/70 text-sm font-maison-neue">To</span>
              <div className="flex items-center gap-2">
                {/* Wallet icon */}
                <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                </svg>
                <span className="text-white/50 text-xs font-maison-neue">
                  {isWrapMode
                    ? lzrBTCBalanceLoading
                      ? '...'
                      : `${lzrBTCBalanceData?.formatted || '0'}`
                    : balanceLoading
                      ? '...'
                      : `${balanceData?.formatted || '0'}`}
                </span>
              </div>
            </div>

            {/* Token and Amount container */}
            <div className="bg-black/40 rounded-lg p-3 border border-lightgreen-100/20">
              <div className="flex items-center justify-between">
                {/* Token Display */}
                <div className="flex items-center gap-2">
                  <img
                    src="/icons/crypto/bitcoin.svg"
                    alt={isWrapMode ? 'lzrBTC' : 'WBTC'}
                    className="w-8 h-8 flex-shrink-0"
                  />
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-base">{isWrapMode ? 'lzrBTC' : 'WBTC'}</span>
                    <span className="text-white/50 text-xs">Arbitrum One</span>
                  </div>
                </div>

                {/* Amount Display */}
                <div className="flex flex-col items-end flex-1 min-w-0">
                  <div className="text-white text-2xl font-bold truncate w-full text-right">
                    {expectedOutput || '0'}
                  </div>
                  {/* USD Value inside the card */}
                  <div className="text-white/40 text-xs mt-1 truncate w-full text-right">
                    ≈ {formatUSDValue(expectedOutput)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error message after all cards */}
      {(isWrapMode ? errors.amount : unwrapErrors.amount) && (
        <div className="text-red-500 text-sm max-w-[28rem] mt-2 mb-2">
          {isWrapMode ? errors.amount?.message : unwrapErrors.amount?.message}
        </div>
      )}

      {/* Action Button */}
      <div className="w-full max-w-[28rem] mt-3">
        {chainId === arbitrum.id ? (
          <>
            {/* Reset allowance button (only shown when needed) */}
            {approvalData &&
              selectedToken === 'wbtc' &&
              !decimalsConversion &&
              BigInt(approvalData) > BigInt(balanceData?.value || 0) &&
              isWrapMode && (
                <Button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault()
                    console.log('Resetting WBTC allowance to 0...')
                    try {
                      const resetTx = await writeContract(config, {
                        abi: erc20Abi,
                        address: ERC20_CONTRACT_ADDRESS[selectedToken] as `0x${string}`,
                        functionName: 'approve' as const,
                        args: [WRAP_CONTRACT as `0x${string}`, BigInt(0)] as const,
                      })
                      await waitForTransactionReceipt(config, { hash: resetTx })
                      toast(<TXToast {...{ message: 'Allowance reset to 0. Now approve the correct amount.' }} />, {
                        autoClose: 7000,
                      })
                      setRefresh((prev) => !prev)
                    } catch (error) {
                      console.error('Reset failed:', error)
                    }
                  }}
                  className="bg-red-600 mb-3"
                >
                  RESET ALLOWANCE (Required)
                </Button>
              )}

            <Button
              type="submit"
              disabled={
                isWrapMode
                  ? !isValid ||
                    !watch('amount') ||
                    watch('amount') === '' ||
                    isLoadingApproval ||
                    isApproving ||
                    isWrapping
                  : !isUnwrapValid ||
                    !unwrapWatch('amount') ||
                    unwrapWatch('amount') === '' ||
                    !lzrBTCBalanceData?.value ||
                    lzrBTCBalanceData.value === 0n ||
                    isUnwrapping
              }
            >
              {isWrapMode ? (
                approval ? (
                  isWrapping ? (
                    <Loading text="WRAPPING" />
                  ) : (
                    'WRAP'
                  )
                ) : isApproving ? (
                  <Loading text="APPROVING" />
                ) : (
                  'APPROVE'
                )
              ) : isUnwrapping ? (
                <Loading text="UNWRAPPING" />
              ) : (
                'UNWRAP'
              )}
            </Button>
          </>
        ) : (
          <Button
            type="submit"
            onClick={(e) => {
              e.preventDefault()
              handleChainSwitch(false)
            }}
          >
            SWITCH TO ARBITRUM
          </Button>
        )}
      </div>

      {/* Expandable Details Section - Keep gradient */}
      <div className="relative group max-w-[28rem] mt-4">
        <div className="absolute inset-0 bg-gradient-to-br from-lightgreen-100/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500 rounded-[.115rem]" />
        <div className="relative bg-gradient-to-br from-darkslategray-200/90 via-darkslategray-200/80 to-transparent backdrop-blur-sm border border-lightgreen-100/30 hover:border-lightgreen-100/50 transition-all duration-300 rounded-[.115rem]">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full px-4 py-3 flex justify-between items-center text-white/70 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-maison-neue">
                1 {isWrapMode ? 'WBTC' : 'lzrBTC'} = 1 {isWrapMode ? 'lzrBTC' : 'WBTC'}
                {btcPrice > 0 &&
                  ` ($${btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
              </span>
            </div>
            <svg
              className={clsx('w-4 h-4 transition-transform duration-300', showDetails && 'rotate-180')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Collapsible Details */}
          <div className={clsx('overflow-hidden transition-all duration-300', showDetails ? 'max-h-96' : 'max-h-0')}>
            <div className="px-4 pb-3 space-y-3 border-t border-lightgreen-100/20">
              <div className="flex justify-between items-center pt-3">
                <span className="text-white/50 text-xs font-maison-neue">Expected Output</span>
                <span className="text-white text-xs font-maison-neue">
                  {expectedOutput || '0'} {isWrapMode ? 'lzrBTC' : 'WBTC'}
                </span>
              </div>

              <div className="h-px bg-lightgreen-100/10"></div>

              <div className="flex justify-between items-center">
                <span className="text-white/50 text-xs font-maison-neue">Price Impact</span>
                <span className="text-lightgreen-100 text-xs font-maison-neue">0.00%</span>
              </div>

              <div className="h-px bg-lightgreen-100/10"></div>

              <div className="flex justify-between items-center">
                <span className="text-white/50 text-xs font-maison-neue">Network Fee</span>
                <span className="text-white text-xs font-maison-neue">
                  {wrapDetails.isLoading ? '...' : wrapDetails.networkFee}
                </span>
              </div>

              <div className="h-px bg-lightgreen-100/10"></div>

              <div className="flex justify-between items-center">
                <span className="text-white/50 text-xs font-maison-neue">Route</span>
                <div className="flex items-center gap-1">
                  <span className="text-white text-xs font-ocrx">{isWrapMode ? 'WBTC' : 'lzrBTC'}</span>
                  <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-white text-xs font-ocrx">{isWrapMode ? 'lzrBTC' : 'WBTC'}</span>
                </div>
              </div>

              <div className="h-px bg-lightgreen-100/10"></div>

              <div className="flex justify-between items-center">
                <span className="text-white/50 text-xs font-maison-neue">Minimum Received</span>
                <span className="text-white text-xs font-maison-neue">
                  {expectedOutput || '0'} {isWrapMode ? 'lzrBTC' : 'WBTC'}
                </span>
              </div>

              <div className="h-px bg-lightgreen-100/10"></div>

              <div className="flex justify-between items-center">
                <span className="text-white/50 text-xs font-maison-neue">Exchange Rate</span>
                <span className="text-white text-xs font-maison-neue">1:1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

export default BridgeWrap
