import { Button, InputField, TXToast } from '@components/index'
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

interface IBridgeCrosschain {}

const BridgeCrosschain: FC<IBridgeCrosschain> = () => {
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

  const { address, chainId, connector } = useAccount()
  const [approval, setApproval] = useState<boolean>(false)
  const [refreshApproval, setRefreshApproval] = useState(false)
  const [isWaitingForBridgeTx, setIsWaitingForBridgeTx] = useState(false)
  const [isApproving, setIsApproving] = useState<boolean>(false)
  const [isBridging, setIsBridging] = useState<boolean>(false)
  const [isBridgingReverse, setIsBridgingReverse] = useState<boolean>(false)
  const [bridgeSuccessInfo, setBridgeSuccessInfo] = useState<{ txHash: string } | null>(null)
  const [bridgeReverseSuccessInfo, setBridgeReverseSuccessInfo] = useState<{ txHash: string } | null>(null)

  const { data: approvalData } = useReadContract({
    abi: lzrBTC_abi,
    address: ERC20_CONTRACT_ADDRESS['lzrBTC'],
    functionName: 'allowance',
    args: [address, L2_GATEWAY_ROUTER],
    chainId: arbitrum.id,
    scopeKey: refreshApproval.toString(),
  })

  useEffect(() => {
    const fetchApprovalData = () => {
      const amount = getValues('amount')

      // If no amount entered, always show APPROVE
      if (!amount || amount === '0' || amount === '') {
        setApproval(false)
        return
      }

      if (approvalData !== undefined) {
        try {
          const approvalAmount = approvalData as unknown as string
          if (BigNumber.from(approvalAmount).gte(parseEther(amount))) {
            setApproval(true)
          } else {
            setApproval(false)
          }
        } catch (error) {
          // Invalid amount format - show APPROVE
          setApproval(false)
        }
      }
    }
    fetchApprovalData()
  }, [approvalData, watch('amount'), refreshApproval])

  const handleApprove = async () => {
    setIsApproving(true)
    const approvalArgs = {
      abi: lzrBTC_abi,
      address: ERC20_CONTRACT_ADDRESS['lzrBTC'],
      functionName: 'approve',
      args: [L2_GATEWAY_ROUTER, parseEther(getValues('amount'))],
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
      setTimeout(() => {
        setRefreshApproval((prev) => !prev)
      }, 1000)
    } else {
      toast(<TXToast {...{ message: 'Approval failed' }} />, { autoClose: 7000 })
    }
    setIsApproving(false)
  }

  const handleDeposit = async (toL3: boolean) => {
    if (toL3) {
      setIsBridging(true)
    } else {
      setIsBridgingReverse(true)
    }
    if (!connector) {
      if (toL3) {
        setIsBridging(false)
      } else {
        setIsBridgingReverse(false)
      }
      return
    }
    const provider = await connector.getProvider()
    if (!provider) {
      if (toL3) {
        setIsBridging(false)
      } else {
        setIsBridgingReverse(false)
      }
      return
    }
    const web3Provider = new ethers.providers.Web3Provider(provider)
    const signer = web3Provider.getSigner()
    const L2GatewayRouterABI = toL3
      ? ['function depositERC20(uint256 amount)']
      : ['function withdrawEth(address destination)']
    const l2GatewayRouterContract = new ethers.Contract(
      toL3 ? L2_GATEWAY_ROUTER : L2_GATEWAY_ROUTER_BACK,
      L2GatewayRouterABI,
      signer,
    )
    try {
      // Perform the outbound transfer via L2 Gateway Router
      const amount = toL3 ? getValues('amount') : getValuesReverse('amount')

      const tx = toL3
        ? await l2GatewayRouterContract.depositERC20(parseEther(amount))
        : await signer.sendTransaction({
            to: L2_GATEWAY_ROUTER_BACK,
            data: l2GatewayRouterContract.interface.encodeFunctionData('withdrawEth', [address]),
            value: parseEther(amount),
          })
      setIsWaitingForBridgeTx(true)
      const receipt = await tx.wait()
      setIsWaitingForBridgeTx(false)

      if (receipt.status === 1) {
        const txHash = receipt.transactionHash
        toast(<TXToast {...{ message: 'Bridge successful', txHash }} />, { autoClose: 7000 })
        const cookies = new Cookies()
        cookies.set('hasBridged', 'true', { path: '/' })
        // Clear input and refresh balances
        if (toL3) {
          setValue('amount', '')
          trigger('amount')
          setApproval(false)
          setBridgeSuccessInfo({ txHash })
        } else {
          setValueReverse('amount', '')
          triggerReverse('amount')
          setBridgeReverseSuccessInfo({ txHash })
        }
        // Single refresh after successful transaction
        setRefreshApproval((prev) => !prev)
        refetchBalance()
        refetchBalanceL3()
      } else {
        toast(<TXToast {...{ message: 'Bridge failed' }} />, { autoClose: 7000 })
      }
    } catch (error: any) {
      // Check if user rejected the transaction
      if (error?.message?.includes('User rejected') || error?.message?.includes('User denied')) {
        toast(<TXToast {...{ message: 'Transaction rejected by user' }} />, { autoClose: 7000 })
      } else {
        toast(<TXToast {...{ message: `Failed to Bridge tokens: ${error.reason || error.message}` }} />, {
          autoClose: 7000,
        })
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

  const handleBridgeBack = async () => {
    await handleDeposit(false)
  }

  const onSubmitReverse = async () => {
    await handleBridgeBack()
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

  const {
    data: l3Data,
    isLoading: l3isLoading,
    refetch: refetchBalanceL3,
  } = useBalance({
    address,
    chainId: mainnet.id,
  })

  return (
    <div className="flex flex-col gap-7">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-7">
        <div className="flex flex-col gap-[0.687rem] max-w-full">
          <label className="text-lightgreen-100">## BRIDGE lzrBTC TO BITLAZER</label>
          <Controller
            name="amount"
            control={control}
            rules={{
              required: 'Amount is required',
              min: { value: 0.00000001, message: 'Amount must be greater than 0.00000001' },
              max: {
                value: data?.formatted || '0',
                message: 'Insufficient balance',
              },
            }}
            render={({ field }) => (
              <InputField
                placeholder="0.00"
                label="ENTER AMOUNT"
                type="number"
                {...field}
                error={errors.amount ? errors.amount.message : null}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
              />
            )}
          />
          <div className="flex flex-row items-center justify-between gap-[1.25rem] text-gray-200">
            <div className="tracking-[-0.06em] leading-[1.25rem] inline-block">
              Balance: {isLoading ? 'Loading...' : `${formatEther(data?.value.toString() || '0')} lzrBTC`}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault()
                setValue('amount', formatEther(data?.value.toString() || '0'))
                trigger('amount')
              }}
              className="shadow-[1.8px_1.8px_1.84px_#66d560_inset] rounded-[.115rem] bg-darkolivegreen-200 flex flex-row items-start justify-start pt-[0.287rem] pb-[0.225rem] pl-[0.437rem] pr-[0.187rem] shrink-0 text-[0.813rem] text-lightgreen-100 disabled:opacity-40 disabled:pointer-events-none disabled:touch-none"
            >
              <span className="relative tracking-[-0.06em] leading-[0.563rem] inline-block [text-shadow:0.2px_0_0_#66d560,_0_0.2px_0_#66d560,_-0.2px_0_0_#66d560,_0_-0.2px_0_#66d560] min-w-[1.75rem]">
                MAX
              </span>
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-[0.687rem]">
          {chainId === arbitrum.id ? (
            <>
              <Button
                type="submit"
                disabled={
                  !isValid ||
                  !watch('amount') ||
                  watch('amount') === '' ||
                  isWaitingForBridgeTx ||
                  isApproving ||
                  isBridging
                }
                aria-busy={isWaitingForBridgeTx || isApproving || isBridging}
              >
                {approval ? (
                  isBridging ? (
                    <Loading text="BRIDGING" />
                  ) : (
                    'BRIDGE'
                  )
                ) : isApproving ? (
                  <Loading text="APPROVING" />
                ) : (
                  'APPROVE'
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
        {bridgeSuccessInfo && (
          <div className="mt-4 p-2.5 bg-darkslategray-200 border border-lightgreen-100 rounded-[.115rem] text-gray-200 text-[13px]">
            <div className="mb-1.5">
              <span className="text-lightgreen-100">Transaction: </span>
              <a
                href={`https://arbiscan.io/tx/${bridgeSuccessInfo.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-lightgreen-100 underline hover:text-lightgreen-200"
              >
                {fmtHash(bridgeSuccessInfo.txHash)}
              </a>
            </div>
            <div className="mb-1.5 flex items-start">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="mr-1.5 mt-0.5 flex-shrink-0"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="8" cy="8" r="7" stroke="#66d560" strokeWidth="1.5" />
                <path d="M8 7V11" stroke="#66d560" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="5" r="0.5" fill="#66d560" />
              </svg>
              <span>Balance may take a while to be confirmed on Bitlazer network.</span>
            </div>
            <div>
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
      </form>
      <div className="h-px w-full bg-[#6c6c6c]"></div>
      <form onSubmit={handleSubmitReverse(onSubmitReverse)} className="flex flex-col gap-7">
        <div className="flex flex-col gap-[0.687rem] max-w-full">
          <label className="text-lightgreen-100">## BRIDGE lzrBTC TO ARBITRUM</label>
          <Controller
            name="amount"
            control={controlReverse}
            rules={{
              required: 'Amount is required',
              min: { value: 0.00000001, message: 'Amount must be greater than 0.00000001' },
              max: {
                value: formatEther(l3Data?.value.toString() || '0'),
                message: 'Insufficient balance',
              },
            }}
            render={({ field }) => (
              <InputField
                placeholder="0.00"
                label="ENTER AMOUNT"
                type="number"
                {...field}
                error={errorsReverse.amount ? errorsReverse.amount.message : null}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
              />
            )}
          />
          <div className="flex flex-row items-center justify-between gap-[1.25rem] text-gray-200">
            <div className="tracking-[-0.06em] leading-[1.25rem] inline-block">
              Balance:{' '}
              {l3isLoading ? 'Loading...' : `${formatEther(l3Data?.value.toString() || '0')} ${l3Data?.symbol}`}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault()
                setValueReverse('amount', formatEther(l3Data?.value.toString() || '0'))
                triggerReverse('amount')
              }}
              className="shadow-[1.8px_1.8px_1.84px_#66d560_inset] rounded-[.115rem] bg-darkolivegreen-200 flex flex-row items-start justify-start pt-[0.287rem] pb-[0.225rem] pl-[0.437rem] pr-[0.187rem] shrink-0 text-[0.813rem] text-lightgreen-100 disabled:opacity-40 disabled:pointer-events-none disabled:touch-none"
            >
              <span className="relative tracking-[-0.06em] leading-[0.563rem] inline-block [text-shadow:0.2px_0_0_#66d560,_0_0.2px_0_#66d560,_-0.2px_0_0_#66d560,_0_-0.2px_0_#66d560] min-w-[1.75rem]">
                MAX
              </span>
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-[0.687rem]">
          {chainId === mainnet.id ? (
            <>
              <Button
                type="submit"
                disabled={
                  !isValidReverse ||
                  !watchReverse('amount') ||
                  watchReverse('amount') === '' ||
                  isWaitingForBridgeTx ||
                  isBridgingReverse
                }
                aria-busy={isWaitingForBridgeTx || isBridgingReverse}
              >
                {isBridgingReverse ? <Loading text="BRIDGING" /> : 'BRIDGE'}
              </Button>
            </>
          ) : (
            <Button
              type="submit"
              onClick={(e) => {
                e.preventDefault()
                handleChainSwitch(true)
              }}
            >
              SWITCH TO BITLAZER
            </Button>
          )}
        </div>
        {bridgeReverseSuccessInfo && (
          <div className="mt-4 p-2.5 bg-darkslategray-200 border border-lightgreen-100 rounded-[.115rem] text-gray-200 text-[13px]">
            <div className="mb-1.5">
              <span className="text-lightgreen-100">Transaction: </span>
              <a
                href={`https://bitlazer.calderaexplorer.xyz/tx/${bridgeReverseSuccessInfo.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-lightgreen-100 underline hover:text-lightgreen-200"
              >
                {fmtHash(bridgeReverseSuccessInfo.txHash)}
              </a>
            </div>
            <div className="mb-1.5 flex items-start">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="mr-1.5 mt-0.5 flex-shrink-0"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="8" cy="8" r="7" stroke="#66d560" strokeWidth="1.5" />
                <path d="M8 7V11" stroke="#66d560" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="5" r="0.5" fill="#66d560" />
              </svg>
              <span>Balance may take a while to be confirmed on Arbitrum network.</span>
            </div>
            <div>
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
      </form>
    </div>
  )
}

export default BridgeCrosschain
