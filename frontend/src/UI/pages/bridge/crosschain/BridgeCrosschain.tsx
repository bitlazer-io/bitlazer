import { Button, TXToast } from '@components/index'
import Loading from '@components/loading/Loading'
import { fmtHash } from 'src/utils/fmt'
import React, { FC, useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { arbitrum } from 'wagmi/chains'
import { ERC20_CONTRACT_ADDRESS, L2_GATEWAY_ROUTER, L2_GATEWAY_ROUTER_BACK } from '../../../../web3/contracts'
import { useAccount, useBalance, useReadContract } from 'wagmi'
import { writeContract, waitForTransactionReceipt } from '@wagmi/core'
import { BigNumber, ethers } from 'ethers'
import { toast } from 'react-toastify'
import { formatEther, parseEther } from 'ethers/lib/utils'
import { config } from 'src/web3/config'
import { lzrBTC_abi } from 'src/assets/abi/lzrBTC'
import Cookies from 'universal-cookie'
import { mainnet } from 'src/web3/chains'
import { handleChainSwitch } from 'src/web3/functions'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import { fetchWithCache, debouncedFetch, CACHE_KEYS, CACHE_TTL } from 'src/utils/cache'
import { useBridgeDetails } from 'src/hooks/useBridgeDetails'

interface IBridgeCrosschain {}

const BridgeCrosschain: FC<IBridgeCrosschain> = () => {
  const navigate = useNavigate()
  const [isBridgeMode, setIsBridgeMode] = useState(true)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [btcPrice, setBtcPrice] = useState<number>(0)

  // Dynamic bridge details
  const bridgeDetails = useBridgeDetails(isBridgeMode)

  const {
    handleSubmit,
    control,
    watch,
    getValues,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      amount: '',
    },
    mode: 'onChange',
  })

  const {
    handleSubmit: handleSubmitReverse,
    control: controlReverse,
    watch: watchReverse,
    getValues: getValuesReverse,
    setValue: setValueReverse,
    trigger: triggerReverse,
    formState: { errors: errorsReverse, isValid: isValidReverse },
  } = useForm({
    defaultValues: {
      amount: '',
    },
    mode: 'onChange',
  })

  // Fetch BTC price
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
        setBtcPrice(data['wrapped-bitcoin']?.usd || 0)
      } catch (error) {
        console.error('Error fetching BTC price:', error)
      }
    }

    fetchBTCPrice()
    const interval = setInterval(fetchBTCPrice, 30000)
    return () => clearInterval(interval)
  }, [])

  const { address, chainId } = useAccount()
  const [isWaitingForBridgeTx, setIsWaitingForBridgeTx] = useState(false)
  const [approval, setApproval] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isBridging, setIsBridging] = useState(false)
  const [isBridgingReverse, setIsBridgingReverse] = useState(false)
  const [refreshApproval, setRefreshApproval] = useState(false)
  const [bridgeSuccessInfo, setBridgeSuccessInfo] = useState<{ txHash: string } | null>(null)
  const [bridgeReverseSuccessInfo, setBridgeReverseSuccessInfo] = useState<{ txHash: string } | null>(null)

  const { data: approvalData } = useReadContract({
    address: ERC20_CONTRACT_ADDRESS['lzrBTC'],
    abi: lzrBTC_abi,
    functionName: 'allowance',
    args: [address, L2_GATEWAY_ROUTER],
    chainId: arbitrum.id,
    scopeKey: refreshApproval.toString(),
  })

  useEffect(() => {
    if (approvalData) {
      const _allowance = BigNumber.from(approvalData)
      const _amountRequested = watch('amount')
      if (_amountRequested && _allowance.gte(ethers.utils.parseEther(_amountRequested))) {
        setApproval(true)
      } else {
        setApproval(false)
      }
    }
  }, [approvalData, watch('amount')])

  const handleApprove = async () => {
    if (!address) return
    const amount = getValues('amount')
    if (!amount || amount === '' || parseFloat(amount) <= 0) {
      toast(<TXToast {...{ message: 'Invalid amount' }} />, { autoClose: 7000 })
      return
    }

    setIsApproving(true)
    try {
      // Fix: Truncate to 18 decimals to avoid parseEther overflow
      const truncatedAmount = parseFloat(amount).toFixed(18)
      const parsedAmount = parseEther(truncatedAmount)
      const data = await writeContract(config, {
        abi: lzrBTC_abi,
        address: ERC20_CONTRACT_ADDRESS['lzrBTC'],
        functionName: 'approve',
        args: [L2_GATEWAY_ROUTER, parsedAmount],
        chainId: arbitrum.id,
      })

      const receipt = await waitForTransactionReceipt(config, { hash: data })
      setApproval(true)
      const txHash = receipt.transactionHash
      toast(<TXToast {...{ message: 'Approval successful', txHash }} />, { autoClose: 7000 })
      setRefreshApproval((prev) => !prev)
    } catch (error: any) {
      console.error('🚨 Approval Error Details:', {
        amount,
        contractAddress: ERC20_CONTRACT_ADDRESS['lzrBTC'],
        spender: L2_GATEWAY_ROUTER,
        userAddress: address,
        error: error,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorStack: error?.stack,
      })

      if (!error.message.includes('User rejected the request.')) {
        toast(<TXToast {...{ message: 'Failed to approve' }} />, { autoClose: 7000 })
      }
    } finally {
      setIsApproving(false)
    }
  }

  const handleDeposit = async (toL3: boolean) => {
    if (!address) return
    const amount = toL3 ? getValues('amount') : getValuesReverse('amount')
    if (!amount || amount === '' || parseFloat(amount) <= 0) {
      toast(<TXToast {...{ message: 'Invalid amount' }} />, { autoClose: 7000 })
      return
    }

    setIsWaitingForBridgeTx(true)
    if (toL3) {
      setIsBridging(true)
    } else {
      setIsBridgingReverse(true)
    }

    try {
      // Fix: Truncate to 18 decimals to avoid parseEther overflow
      const truncatedAmount = parseFloat(amount).toFixed(18)
      const parsedAmount = parseEther(truncatedAmount)
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()

      // Restore original bridge contract logic
      const L2GatewayRouterABI = toL3
        ? ['function depositERC20(uint256 amount)']
        : ['function withdrawEth(address destination)']
      const l2GatewayRouterContract = new ethers.Contract(
        toL3 ? L2_GATEWAY_ROUTER : L2_GATEWAY_ROUTER_BACK,
        L2GatewayRouterABI,
        signer,
      )

      // Perform the outbound transfer via L2 Gateway Router
      const tx = toL3
        ? await l2GatewayRouterContract.depositERC20(parsedAmount)
        : await signer.sendTransaction({
            to: L2_GATEWAY_ROUTER_BACK,
            data: l2GatewayRouterContract.interface.encodeFunctionData('withdrawEth', [address]),
            value: parsedAmount,
          })

      setIsWaitingForBridgeTx(true)
      const receipt = await tx.wait()
      setIsWaitingForBridgeTx(false)
      const txHash = receipt.transactionHash

      if (receipt.status === 1) {
        toast(<TXToast {...{ message: 'Bridge successful', txHash }} />, { autoClose: 7000 })
        const cookies = new Cookies()
        cookies.set('hasBridged', 'true', { path: '/' })

        if (toL3) {
          setValue('amount', '')
          trigger('amount')
          setApproval(false)
          setBridgeSuccessInfo({ txHash })
          // Redirect to stake page after successful bridge to Bitlazer
          setTimeout(() => {
            navigate('/bridge/stake')
          }, 1500)
        } else {
          setValueReverse('amount', '')
          triggerReverse('amount')
          setBridgeReverseSuccessInfo({ txHash })
        }

        setRefreshApproval((prev) => !prev)
        refetchBalance()
      } else {
        throw new Error('Transaction failed')
      }
    } catch (error: any) {
      console.error('🚨 Bridge Error Details:', {
        bridgeDirection: toL3 ? 'Arbitrum → Bitlazer' : 'Bitlazer → Arbitrum',
        amount,
        targetAddress: toL3 ? L2_GATEWAY_ROUTER : L2_GATEWAY_ROUTER_BACK,
        chainId: toL3 ? arbitrum.id : mainnet.id,
        userAddress: address,
        error: error,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorStack: error?.stack,
      })

      if (error.message.includes('insufficient funds')) {
        toast(<TXToast {...{ message: 'Insufficient gas funds. You need ETH to pay for gas.' }} />, {
          autoClose: 7000,
        })
      } else if (error.message.includes('user rejected transaction')) {
        toast(<TXToast {...{ message: 'Transaction rejected.' }} />, { autoClose: 7000 })
      } else {
        toast(<TXToast {...{ message: 'Failed to Bridge' }} />, { autoClose: 7000 })
      }
    } finally {
      setIsWaitingForBridgeTx(false)
      if (toL3) {
        setIsBridging(false)
      } else {
        setIsBridgingReverse(false)
      }
    }
  }

  const onSubmit = async () => {
    approval ? handleDeposit(true) : handleApprove()
  }

  const onSubmitReverse = async () => {
    await handleDeposit(false)
  }

  const handleSwitch = () => {
    setIsBridgeMode(!isBridgeMode)
    setValue('amount', '')
    setValueReverse('amount', '')
    setIsInputFocused(false)
  }

  const handlePercentage = (percentage: number) => {
    const balance = isBridgeMode
      ? formatEther(data?.value.toString() || '0')
      : formatEther(l3Data?.value.toString() || '0')

    if (balance) {
      // For MAX (100%), reduce slightly to avoid validation issues
      const multiplier = percentage === 100 ? 0.999999 : percentage / 100
      const value = (parseFloat(balance) * multiplier).toString()
      if (isBridgeMode) {
        setValue('amount', value)
        trigger('amount')
      } else {
        setValueReverse('amount', value)
        triggerReverse('amount')
      }
    }
  }

  const formatUSDValue = (amount: string | undefined) => {
    if (!amount || !btcPrice) return '$0.00'
    const value = parseFloat(amount) * btcPrice
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const {
    data,
    isLoading,
    refetch: refetchBalance,
  } = useBalance({
    address,
    token: ERC20_CONTRACT_ADDRESS['lzrBTC'],
    chainId: arbitrum.id,
  })

  const { data: l3Data, isLoading: l3isLoading } = useBalance({
    address,
    chainId: mainnet.id,
  })

  // Calculate expected output (1:1 ratio minus gas)
  const expectedOutput = isBridgeMode ? watch('amount') : watchReverse('amount')

  // Get the current chain requirement
  const requiredChainId = isBridgeMode ? arbitrum.id : mainnet.id
  const isCorrectChain = chainId === requiredChainId

  return (
    <form
      onSubmit={isBridgeMode ? handleSubmit(onSubmit) : handleSubmitReverse(onSubmitReverse)}
      className="flex flex-col"
    >
      {/* Title & Description - Match exact styling from BridgeWrap */}
      <div className="flex flex-col gap-4 mb-6 text-2xl font-ocrx">
        <div className="text-2xl">
          <span>[ </span>
          <span className="text-lightgreen-100">{isBridgeMode ? 'Step 2' : 'Step 5'}</span>
          <span> | </span>
          <span className="text-fuchsia">
            {isBridgeMode ? 'Bridge lzrBTC to Bitlazer' : 'Bridge lzrBTC to Arbitrum'}
          </span>
          <span> ] </span>
        </div>
        <div className="tracking-[-0.06em] leading-[1.313rem]">
          {isBridgeMode
            ? 'Bridge your lzrBTC from Arbitrum to Bitlazer L3 securely. Your lzrBTC will then be ready for staking!'
            : 'Bridge your lzrBTC back from Bitlazer to Arbitrum. Get ready to enjoy your staking rewards!'}
        </div>
      </div>

      {/* Main Bridge Container */}
      <div className="relative max-w-[28rem]">
        {/* From Card */}
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
                    {isBridgeMode
                      ? isLoading
                        ? '...'
                        : `${formatEther(data?.value.toString() || '0')}`
                      : l3isLoading
                        ? '...'
                        : `${formatEther(l3Data?.value.toString() || '0')}`}
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
                    alt="lzrBTC"
                    className="w-8 h-8 flex-shrink-0 transition-transform duration-300 hover:rotate-12"
                  />
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-base transition-colors duration-200">lzrBTC</span>
                    <span className="text-white/50 text-xs">{isBridgeMode ? 'Arbitrum One' : 'Bitlazer L3'}</span>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="flex flex-col items-end flex-1 min-w-0">
                  <Controller
                    key={isBridgeMode ? 'bridge-amount' : 'reverse-amount'}
                    name="amount"
                    control={isBridgeMode ? control : controlReverse}
                    rules={{
                      required: 'Amount is required',
                      min: { value: 0.00000001, message: 'Amount must be greater than 0.00000001' },
                      max: {
                        value: isBridgeMode
                          ? formatEther(data?.value.toString() || '0')
                          : formatEther(l3Data?.value.toString() || '0'),
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
                    ≈ {formatUSDValue(isBridgeMode ? watch('amount') : watchReverse('amount'))}
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

        {/* To Card */}
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
                  {isBridgeMode
                    ? l3isLoading
                      ? '...'
                      : `${formatEther(l3Data?.value.toString() || '0')}`
                    : isLoading
                      ? '...'
                      : `${formatEther(data?.value.toString() || '0')}`}
                </span>
              </div>
            </div>

            {/* Token and Amount container */}
            <div className="bg-black/40 rounded-lg p-3 border border-lightgreen-100/20">
              <div className="flex items-center justify-between">
                {/* Token Display */}
                <div className="flex items-center gap-2">
                  <img src="/icons/crypto/bitcoin.svg" alt="lzrBTC" className="w-8 h-8 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-base">lzrBTC</span>
                    <span className="text-white/50 text-xs">{isBridgeMode ? 'Bitlazer L3' : 'Arbitrum One'}</span>
                  </div>
                </div>

                {/* Amount Display */}
                <div className="flex flex-col items-end flex-1 min-w-0">
                  <div className="text-white text-2xl font-bold truncate w-full text-right">
                    {expectedOutput || '0'}
                  </div>
                  {/* Token type info inside the card */}
                  <div className="text-white/40 text-xs mt-1 truncate w-full text-right">
                    {isBridgeMode ? 'Native gas token' : 'ERC-20 token'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error message after all cards */}
      {(isBridgeMode ? errors.amount : errorsReverse.amount) && (
        <div className="text-red-500 text-sm max-w-[28rem] mt-2 mb-2">
          {isBridgeMode ? errors.amount?.message : errorsReverse.amount?.message}
        </div>
      )}

      {/* Action Button */}
      <div className="w-full max-w-[28rem] mt-3">
        {isCorrectChain ? (
          <Button
            type="submit"
            disabled={
              isBridgeMode
                ? !isValid ||
                  !watch('amount') ||
                  watch('amount') === '' ||
                  isWaitingForBridgeTx ||
                  isApproving ||
                  isBridging
                : !isValidReverse ||
                  !watchReverse('amount') ||
                  watchReverse('amount') === '' ||
                  isWaitingForBridgeTx ||
                  isBridgingReverse
            }
          >
            {isBridgeMode ? (
              approval ? (
                isBridging || isWaitingForBridgeTx ? (
                  <Loading text="BRIDGING" />
                ) : (
                  'BRIDGE'
                )
              ) : isApproving ? (
                <Loading text="APPROVING" />
              ) : (
                'APPROVE'
              )
            ) : isBridgingReverse || isWaitingForBridgeTx ? (
              <Loading text="BRIDGING" />
            ) : (
              'BRIDGE'
            )}
          </Button>
        ) : (
          <Button
            type="submit"
            onClick={(e) => {
              e.preventDefault()
              handleChainSwitch(requiredChainId === mainnet.id)
            }}
          >
            SWITCH TO {requiredChainId === mainnet.id ? 'BITLAZER' : 'ARBITRUM'}
          </Button>
        )}
      </div>

      {/* Success Info Cards */}
      {bridgeSuccessInfo && (
        <div className="mt-4 p-4 bg-darkslategray-200 border border-lightgreen-100 rounded-[.115rem] text-gray-200 max-w-[28rem]">
          <div className="mb-2">
            <span className="text-lightgreen-100 font-ocrx">Transaction: </span>
            <a
              href={`https://arbiscan.io/tx/${bridgeSuccessInfo.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-lightgreen-100 underline hover:text-lightgreen-200"
            >
              {fmtHash(bridgeSuccessInfo.txHash)}
            </a>
          </div>
          <div className="mb-2 flex items-start">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="mr-2 mt-0.5 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="8" cy="8" r="7" stroke="#66d560" strokeWidth="1.5" />
              <path d="M8 7V11" stroke="#66d560" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="5" r="0.5" fill="#66d560" />
            </svg>
            <span className="text-sm">Balance may take up to 15 minutes to be confirmed on Bitlazer network.</span>
          </div>
          <div className="text-sm">
            Track status{' '}
            <a
              href="https://bitlazer.bridge.caldera.xyz/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lightgreen-100 underline hover:text-lightgreen-200"
            >
              here
            </a>
          </div>
        </div>
      )}

      {bridgeReverseSuccessInfo && (
        <div className="mt-4 p-4 bg-darkslategray-200 border border-lightgreen-100 rounded-[.115rem] text-gray-200 max-w-[28rem]">
          <div className="mb-2">
            <span className="text-lightgreen-100 font-ocrx">Transaction: </span>
            <a
              href={`https://bitlazer.calderaexplorer.xyz/tx/${bridgeReverseSuccessInfo.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-lightgreen-100 underline hover:text-lightgreen-200"
            >
              {fmtHash(bridgeReverseSuccessInfo.txHash)}
            </a>
          </div>
          <div className="mb-2 flex items-start">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="mr-2 mt-0.5 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="8" cy="8" r="7" stroke="#66d560" strokeWidth="1.5" />
              <path d="M8 7V11" stroke="#66d560" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="5" r="0.5" fill="#66d560" />
            </svg>
            <span className="text-sm">Withdrawal process may take up to 7 days to complete on Arbitrum network.</span>
          </div>
          <div className="text-sm">
            Track status{' '}
            <a
              href="https://bitlazer.bridge.caldera.xyz/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lightgreen-100 underline hover:text-lightgreen-200"
            >
              here
            </a>
          </div>
        </div>
      )}

      {/* Expandable Details Section */}
      <div className="relative group max-w-[28rem] mt-4">
        <div className="absolute inset-0 bg-gradient-to-br from-lightgreen-100/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500 rounded-[.115rem]" />
        <div className="relative bg-gradient-to-br from-darkslategray-200/90 via-darkslategray-200/80 to-transparent backdrop-blur-sm border border-lightgreen-100/30 hover:border-lightgreen-100/50 transition-all duration-300 rounded-[.115rem]">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full px-4 py-3 flex justify-between items-center text-white/70 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-maison-neue">Bridge Details</span>
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
                <span className="text-white text-xs font-maison-neue">{expectedOutput || '0'} lzrBTC</span>
              </div>

              <div className="h-px bg-lightgreen-100/10"></div>

              <div className="flex justify-between items-center">
                <span className="text-white/50 text-xs font-maison-neue">Bridge Time</span>
                <span className="text-white text-xs font-maison-neue">
                  {bridgeDetails.isLoading ? '...' : bridgeDetails.bridgeTime}
                </span>
              </div>

              <div className="h-px bg-lightgreen-100/10"></div>

              <div className="flex justify-between items-center">
                <span className="text-white/50 text-xs font-maison-neue">Network Fee</span>
                <span className="text-white text-xs font-maison-neue">
                  {bridgeDetails.isLoading ? '...' : bridgeDetails.networkFee}
                </span>
              </div>

              <div className="h-px bg-lightgreen-100/10"></div>

              <div className="flex justify-between items-center">
                <span className="text-white/50 text-xs font-maison-neue">Route</span>
                <div className="flex items-center gap-1">
                  <span className="text-white text-xs font-ocrx">{isBridgeMode ? 'Arbitrum' : 'Bitlazer'}</span>
                  <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-white text-xs font-ocrx">{isBridgeMode ? 'Bitlazer' : 'Arbitrum'}</span>
                </div>
              </div>

              <div className="h-px bg-lightgreen-100/10"></div>

              <div className="flex justify-between items-center">
                <span className="text-white/50 text-xs font-maison-neue">Bridge Protocol</span>
                <span className="text-white text-xs font-maison-neue">{bridgeDetails.protocol}</span>
              </div>

              <div className="h-px bg-lightgreen-100/10"></div>

              <div className="flex justify-between items-center">
                <span className="text-white/50 text-xs font-maison-neue">Token Type</span>
                <span className="text-white text-xs font-maison-neue">
                  {isBridgeMode ? 'ERC-20 → Native' : 'Native → ERC-20'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

export default BridgeCrosschain
