import { Button, TXToast, TokenCard, TransactionStatusCard } from '@components/index'
import { Skeleton } from '@components/skeleton/Skeleton'
import Loading from '@components/loading/Loading'
import { fmtHash } from 'src/utils/fmt'
import React, { FC, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ERC20_CONTRACT_ADDRESS, L2_GATEWAY_ROUTER, L2_GATEWAY_ROUTER_BACK } from '../../../../web3/contracts'
import { useAccount, useBalance, useReadContract } from 'wagmi'
import { writeContract, waitForTransactionReceipt } from '@wagmi/core'
import { BigNumber, ethers } from 'ethers'
import { toast } from 'react-toastify'
import { formatEther, parseEther } from 'ethers/lib/utils'
import { config } from 'src/web3/config'
import { lzrBTC_abi } from 'src/assets/abi/lzrBTC'
import Cookies from 'universal-cookie'
import { SUPPORTED_CHAINS } from 'src/web3/chains'
import { handleChainSwitch } from 'src/web3/functions'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import { fetchWithCache, debouncedFetch, CACHE_KEYS, CACHE_TTL } from 'src/utils/cache'
import { useBridgeDetails } from 'src/hooks/useBridgeDetails'
import { useLastTransaction } from 'src/hooks/useLastTransaction'

interface IBridgeCrosschain {}

const BridgeCrosschain: FC<IBridgeCrosschain> = () => {
  const navigate = useNavigate()
  const [isBridgeMode, setIsBridgeMode] = useState(true)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [btcPrice, setBtcPrice] = useState<number>(0)
  const [minimumAmount, setMinimumAmount] = useState(0.00000001) // Default fallback
  const [minimumAmountFormatted, setMinimumAmountFormatted] = useState('Amount must be greater than 0.00000001')

  // Dynamic bridge details
  const bridgeDetails = useBridgeDetails(isBridgeMode)

  // Transaction tracking
  const {
    getLatestTransactionByType,
    getLatestBridgeTransaction,
    addPendingTransaction,
    updateTransactionStage,
    removePendingTransaction,
    checkTransactionStatus,
    determineTransactionStage,
    isLoading: isLoadingTransactions,
  } = useLastTransaction(isBridgeMode ? 'arbitrum-to-bitlazer' : 'bitlazer-to-arbitrum')

  // Get latest bridge transaction for display (only bridge types)
  const latestBridgeTransaction = getLatestBridgeTransaction()
  // Check if it's a pending transaction (not historical)
  const isPendingTransaction = latestBridgeTransaction && latestBridgeTransaction.status !== 'completed'

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
    const fetchPrices = async () => {
      try {
        const btcData = await fetchWithCache(
          CACHE_KEYS.BTC_PRICE,
          async () => {
            return debouncedFetch(CACHE_KEYS.BTC_PRICE, async () => {
              const response = await fetch(
                'https://api.coingecko.com/api/v3/simple/price?ids=wrapped-bitcoin&vs_currencies=usd',
              )
              if (!response.ok) throw new Error('Failed to fetch BTC price')
              return response.json()
            })
          },
          { ttl: CACHE_TTL.PRICE },
        )

        const wbtcPrice = btcData['wrapped-bitcoin']?.usd || 0
        setBtcPrice(wbtcPrice)

        // Calculate minimum amount equivalent to $0.01
        if (wbtcPrice > 0) {
          const minAmount = 0.01 / wbtcPrice
          const roundedMinAmount = Math.ceil(minAmount * 100000000) / 100000000 // Round up to 8 decimals
          setMinimumAmount(roundedMinAmount)
          setMinimumAmountFormatted('Amount must be greater than $0.01')
        }
      } catch (error) {
        console.error('Error fetching prices:', error)
      }
    }

    fetchPrices()
    const interval = setInterval(fetchPrices, 30000)
    return () => clearInterval(interval)
  }, [])

  // Monitor pending bridge transaction status (only for actual pending transactions)
  useEffect(() => {
    if (!isPendingTransaction) {
      return
    }

    const monitorTransaction = async () => {
      const receipt = await checkTransactionStatus(latestBridgeTransaction.txHash, latestBridgeTransaction.fromChainId)

      if (receipt) {
        const newStage = determineTransactionStage(latestBridgeTransaction, receipt)

        // Update transaction stage if it has changed OR if we have new enhanced details
        const hasEnhancedDetails = receipt && (receipt.blockNumber || receipt.gasUsed)
        const needsUpdate =
          newStage !== latestBridgeTransaction.stage || (hasEnhancedDetails && !latestBridgeTransaction.blockNumber)

        if (needsUpdate) {
          updateTransactionStage(latestBridgeTransaction.txHash, newStage, receipt)
        }
      }
    }

    // Check immediately
    monitorTransaction()

    // Set up polling every 30 seconds for active transactions
    const statusInterval = setInterval(monitorTransaction, 30000)

    return () => clearInterval(statusInterval)
  }, [isPendingTransaction, latestBridgeTransaction?.txHash])

  // Add enhanced details to historical transactions (one-time check)
  useEffect(() => {
    if (!latestBridgeTransaction || isPendingTransaction || latestBridgeTransaction.blockNumber) {
      return // Skip if no transaction, it's pending, or already has enhanced details
    }

    const addEnhancedDetails = async () => {
      const receipt = await checkTransactionStatus(latestBridgeTransaction.txHash, latestBridgeTransaction.fromChainId)

      if (receipt && (receipt.blockNumber || receipt.gasUsed)) {
        updateTransactionStage(latestBridgeTransaction.txHash, latestBridgeTransaction.stage, receipt)
      }
    }

    addEnhancedDetails()
  }, [latestBridgeTransaction?.txHash, latestBridgeTransaction?.blockNumber])

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
    chainId: SUPPORTED_CHAINS.arbitrumOne.id,
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
        chainId: SUPPORTED_CHAINS.arbitrumOne.id as 42161,
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

        // Add transaction to pending tracking
        addPendingTransaction({
          type: toL3 ? 'bridge' : 'bridge-reverse',
          status: 'pending',
          stage: 'submitted',
          fromChain: toL3 ? SUPPORTED_CHAINS.arbitrumOne.name : SUPPORTED_CHAINS.bitlazerL3.name,
          toChain: toL3 ? SUPPORTED_CHAINS.bitlazerL3.name : SUPPORTED_CHAINS.arbitrumOne.name,
          fromToken: 'lzrBTC',
          toToken: 'lzrBTC',
          amount: amount,
          estimatedTime: toL3 ? 15 : 10080, // 15 minutes or 7 days
          txHash: txHash,
          fromChainId: toL3 ? SUPPORTED_CHAINS.arbitrumOne.id : SUPPORTED_CHAINS.bitlazerL3.id,
          toChainId: toL3 ? SUPPORTED_CHAINS.bitlazerL3.id : SUPPORTED_CHAINS.arbitrumOne.id,
          explorerUrl: toL3 ? `https://arbiscan.io/tx/${txHash}` : `https://bitlazer.calderaexplorer.xyz/tx/${txHash}`,
        })

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
        bridgeDirection: toL3
          ? `${SUPPORTED_CHAINS.arbitrumOne.name} → ${SUPPORTED_CHAINS.bitlazerL3.name}`
          : `${SUPPORTED_CHAINS.bitlazerL3.name} → ${SUPPORTED_CHAINS.arbitrumOne.name}`,
        amount,
        targetAddress: toL3 ? L2_GATEWAY_ROUTER : L2_GATEWAY_ROUTER_BACK,
        chainId: toL3 ? SUPPORTED_CHAINS.arbitrumOne.id : SUPPORTED_CHAINS.bitlazerL3.id,
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
    chainId: SUPPORTED_CHAINS.arbitrumOne.id,
  })

  const { data: l3Data, isLoading: l3isLoading } = useBalance({
    address,
    chainId: SUPPORTED_CHAINS.bitlazerL3.id,
  })

  // Calculate expected output (1:1 ratio minus gas)
  const expectedOutput = isBridgeMode ? watch('amount') : watchReverse('amount')

  // Get the current chain requirement
  const requiredChainId = isBridgeMode ? SUPPORTED_CHAINS.arbitrumOne.id : SUPPORTED_CHAINS.bitlazerL3.id
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
            {isBridgeMode
              ? `Bridge lzrBTC to ${SUPPORTED_CHAINS.bitlazerL3.name}`
              : `Bridge lzrBTC to ${SUPPORTED_CHAINS.arbitrumOne.name}`}
          </span>
          <span> ] </span>
        </div>
        <div className="tracking-[-0.06em] leading-[1.313rem]">
          {isBridgeMode
            ? `Bridge your lzrBTC from ${SUPPORTED_CHAINS.arbitrumOne.name} to ${SUPPORTED_CHAINS.bitlazerL3.name} securely. Your lzrBTC will then be ready for staking!`
            : `Bridge your lzrBTC back from ${SUPPORTED_CHAINS.bitlazerL3.name} to ${SUPPORTED_CHAINS.arbitrumOne.name}. Get ready to enjoy your staking rewards!`}
        </div>
      </div>

      {/* Transaction Status Card - Show latest transaction (pending or recent) */}
      {(latestBridgeTransaction || isLoadingTransactions) && (
        <div className="mb-6">
          {isLoadingTransactions && !latestBridgeTransaction ? (
            <div className="w-full">
              <div className="relative overflow-hidden rounded-[.115rem] border transition-all duration-300 bg-gradient-to-r from-darkslategray-200/95 to-darkslategray-200/80 backdrop-blur-sm border-lightgreen-100/30">
                <div className="p-3">
                  {/* Row 1: Title */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base text-white font-ocrx">Loading last transaction...</span>
                  </div>

                  {/* Horizontal Separator */}
                  <div className="h-px bg-lightgreen-100/10 mb-2"></div>

                  {/* Row 2: Full width skeletons */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-2 w-full">
                      {/* TX Hash skeleton - full width */}
                      <Skeleton className="h-3 w-full" />

                      {/* Value badge skeleton */}
                      <Skeleton className="h-6 w-24" />

                      {/* Timeline skeleton */}
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-2 w-8" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            latestBridgeTransaction && (
              <TransactionStatusCard
                transaction={latestBridgeTransaction}
                onClose={
                  isPendingTransaction ? () => removePendingTransaction(latestBridgeTransaction.txHash) : undefined
                }
              />
            )
          )}
        </div>
      )}

      {/* Main Bridge Container */}
      <div className="relative w-full">
        {/* From Card */}
        <TokenCard
          key={isBridgeMode ? 'bridge-amount' : 'reverse-amount'}
          type="from"
          tokenInfo={{
            symbol: 'lzrBTC',
            icon: '/icons/crypto/bitcoin.svg',
            chain: isBridgeMode ? SUPPORTED_CHAINS.arbitrumOne.name : SUPPORTED_CHAINS.bitlazerL3.name,
          }}
          balance={
            isBridgeMode ? formatEther(data?.value.toString() || '0') : formatEther(l3Data?.value.toString() || '0')
          }
          isBalanceLoading={isBridgeMode ? isLoading : l3isLoading}
          isInputFocused={isInputFocused}
          onInputFocus={() => setIsInputFocused(true)}
          onInputBlur={() => setIsInputFocused(false)}
          onPercentageClick={handlePercentage}
          control={isBridgeMode ? control : controlReverse}
          amount={isBridgeMode ? watch('amount') : watchReverse('amount')}
          rules={{
            required: 'Amount is required',
            min: { value: minimumAmount, message: minimumAmountFormatted },
            max: {
              value: isBridgeMode
                ? formatEther(data?.value.toString() || '0')
                : formatEther(l3Data?.value.toString() || '0'),
              message: 'Insufficient balance',
            },
          }}
          usdValue={formatUSDValue(isBridgeMode ? watch('amount') : watchReverse('amount'))}
        />

        {/* Switch Button */}
        <div className="flex justify-center -my-4 relative z-10">
          <button
            type="button"
            onClick={handleSwitch}
            className="bg-darkslategray-200 border-4 border-[#0a0a0a] rounded-[.115rem] p-0.5 hover:bg-darkslategray-100 transition-colors group shadow-lg"
          >
            <svg
              className="w-5 h-5 text-lightgreen-100 group-hover:rotate-180 transition-transform duration-300"
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
        <TokenCard
          type="to"
          tokenInfo={{
            symbol: 'lzrBTC',
            icon: '/icons/crypto/bitcoin.svg',
            chain: isBridgeMode ? SUPPORTED_CHAINS.bitlazerL3.name : SUPPORTED_CHAINS.arbitrumOne.name,
          }}
          balance={
            isBridgeMode ? formatEther(l3Data?.value.toString() || '0') : formatEther(data?.value.toString() || '0')
          }
          isBalanceLoading={isBridgeMode ? l3isLoading : isLoading}
          amount={expectedOutput}
          usdValue={formatUSDValue(expectedOutput)}
          showPercentageButtons={false}
        />
      </div>

      {/* Error message after all cards */}
      {(isBridgeMode ? errors.amount : errorsReverse.amount) && (
        <div className="text-red-500 text-sm w-full mt-2 mb-2">
          {isBridgeMode ? errors.amount?.message : errorsReverse.amount?.message}
        </div>
      )}

      {/* Action Button */}
      <div className="w-full mt-3">
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
              handleChainSwitch(requiredChainId === SUPPORTED_CHAINS.bitlazerL3.id)
            }}
          >
            SWITCH TO{' '}
            {requiredChainId === SUPPORTED_CHAINS.bitlazerL3.id
              ? SUPPORTED_CHAINS.bitlazerL3.name.toUpperCase()
              : SUPPORTED_CHAINS.arbitrumOne.name.toUpperCase()}
          </Button>
        )}
      </div>

      {/* Expandable Details Section */}
      <div className="relative group w-full mt-4">
        <div className="absolute inset-0 bg-gradient-to-br from-lightgreen-100/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500 rounded-[.115rem]" />
        <div className="relative bg-gradient-to-br from-darkslategray-200/90 via-darkslategray-200/80 to-transparent backdrop-blur-sm border border-lightgreen-100/30 hover:border-lightgreen-100/50 transition-all duration-300 rounded-[.115rem]">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowDetails(!showDetails)
            }}
            className="w-full px-4 py-3 flex justify-between items-center text-white/70 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2 text-left">
              <span className="text-sm font-maison-neue text-left">Bridge Details</span>
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
            <div className="px-4 pb-3 space-y-1.5 border-t border-lightgreen-100/20">
              <div className="flex justify-between items-center pt-2">
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
                <span className="text-white/50 text-xs font-maison-neue">Route</span>
                <div className="flex items-center gap-1">
                  <span className="text-white text-xs font-maison-neue">
                    {isBridgeMode ? SUPPORTED_CHAINS.arbitrumOne.name : SUPPORTED_CHAINS.bitlazerL3.name}
                  </span>
                  <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-white text-xs font-maison-neue">
                    {isBridgeMode ? SUPPORTED_CHAINS.bitlazerL3.name : SUPPORTED_CHAINS.arbitrumOne.name}
                  </span>
                </div>
              </div>

              <div className="h-px bg-lightgreen-100/10"></div>

              <div className="flex justify-between items-center">
                <span className="text-white/50 text-xs font-maison-neue">Bridge Method</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-lightgreen-100/20 text-lightgreen-100 px-2 py-0.5 rounded font-maison-neue">
                    Native
                  </span>
                  <span className="text-white/50 text-xs font-maison-neue">•</span>
                  <a
                    href="https://bitlazer.bridge.caldera.xyz/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lightgreen-100 text-xs font-maison-neue hover:text-lightgreen-200 underline"
                  >
                    Orbit Bridge
                  </a>
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

              <div className="h-px bg-lightgreen-100/10 mt-3"></div>

              <div className="text-lightgreen-100 text-xs font-maison-neue mt-2 text-center">
                More bridge options coming soon
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

export default BridgeCrosschain
