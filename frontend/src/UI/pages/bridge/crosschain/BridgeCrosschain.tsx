import { Button, InputField, TXToast } from '@components/index'
import React, { FC, useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { arbitrumSepolia } from 'wagmi/chains'
import {
  ERC20_CONTRACT_ADDRESS,
  L2_GATEWAY_ROUTER,
  L2_GATEWAY_ROUTER_BACK,
  TokenKeys,
} from '../../../../web3/contracts'
import { useAccount, useBalance, useReadContract, useSwitchChain } from 'wagmi'
import { writeContract, waitForTransactionReceipt, simulateContract } from '@wagmi/core'
import { BigNumber, ethers } from 'ethers'
import { toast } from 'react-toastify'
import { formatEther, parseEther } from 'ethers/lib/utils'
import { config } from 'src/web3/config'
import { lzrBTC_abi } from 'src/assets/abi/lzrBTC'
import Cookies from 'universal-cookie'
import { testnet } from 'src/web3/chains'
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
    handleSubmit: handleUnstakeSubmit,
    control: unstakeControl,
    watch: unstakeWatch,
    getValues: unstakeGetValues,
    setValue: unstakeSetValue,
    trigger: unstakeTrigger,
    formState: { errors: unstakeErrors, isValid: unstakeIsValid },
  } = useForm({
    defaultValues: {
      amount: '',
    },
    mode: 'onChange',
  })

  const [selectedToken, setSelectedToken] = useState<TokenKeys>('lzrBTC')
  const { switchChain } = useSwitchChain()
  const { address, isConnected, chainId, connector } = useAccount()
  const [approval, setApproval] = useState<boolean>(false)
  const [refreshApproval, setRefreshApproval] = useState(false)
  const [isWaitingForBridgeTx, setIsWaitingForBridgeTx] = useState(false)

  const { data: approvalData } = useReadContract({
    abi: lzrBTC_abi,
    address: ERC20_CONTRACT_ADDRESS['lzrBTC'],
    functionName: 'allowance',
    args: [address, L2_GATEWAY_ROUTER],
    chainId: arbitrumSepolia.id,
    scopeKey: refreshApproval.toString(),
  })

  useEffect(() => {
    const fetchApprovalData = () => {
      const amount = getValues('amount')

      if (approvalData !== undefined) {
        const approvalAmount = approvalData as unknown as string
        if (BigNumber.from(approvalAmount).gte(parseEther(amount || '0'))) {
          setApproval(true)
        } else {
          setApproval(false)
        }
      }
    }
    fetchApprovalData()
  }, [approvalData, watch('amount'), refreshApproval])

  const handleApprove = async () => {
    const approvalArgs = {
      abi: lzrBTC_abi,
      address: ERC20_CONTRACT_ADDRESS['lzrBTC'],
      functionName: 'approve',
      args: [L2_GATEWAY_ROUTER, parseEther(getValues('amount'))],
    }

    let approvalTransactionHash
    try {
      approvalTransactionHash = await writeContract(config, approvalArgs)
    } catch (error) {
      toast(<TXToast {...{ message: 'Approval failed', error }} />)
      return
    }
    const approvalReceipt = await waitForTransactionReceipt(config, {
      hash: approvalTransactionHash,
    })
    if (approvalReceipt.status === 'success') {
      const txHash = approvalReceipt.transactionHash
      toast(<TXToast {...{ message: 'Approval successful', txHash }} />)
      setTimeout(() => {
        setRefreshApproval((prev) => !prev)
      }, 1000)
    } else {
      toast(<TXToast {...{ message: 'Approval failed' }} />)
    }
  }

  const handleDeposit = async (toL3: boolean) => {
    if (!connector) {
      return
    }
    const provider = await connector.getProvider()
    if (!provider) {
      return
    }
    const web3Provider = new ethers.providers.Web3Provider(provider)
    const signer = web3Provider.getSigner()
    const L2GatewayRouterABI = toL3
      ? ['function depositERC20(uint256 amount)']
      : ['function bridgeBurn(address account, uint256 amount)']
    const l2GatewayRouterContract = new ethers.Contract(
      toL3 ? L2_GATEWAY_ROUTER : L2_GATEWAY_ROUTER_BACK,
      L2GatewayRouterABI,
      signer,
    )
    try {
      // Perform the outbound transfer via L2 Gateway Router
      const tx = toL3
        ? await l2GatewayRouterContract.depositERC20(parseEther(getValues('amount')))
        : await l2GatewayRouterContract.bridgeBurn(address, parseEther('1'))
      setIsWaitingForBridgeTx(true)
      const receipt = await tx.wait()
      setIsWaitingForBridgeTx(false)

      if (receipt.status === 1) {
        const txHash = receipt.transactionHash
        toast(<TXToast {...{ message: 'Bridge successful', txHash }} />)
        const cookies = new Cookies()
        cookies.set('hasBridged', 'true', { path: '/' })
      } else {
        toast(<TXToast {...{ message: 'Bridge failed' }} />)
      }
    } catch (error) {
      toast(<TXToast {...{ message: 'Failed to Bridge tokens' }} />)
    }
    setTimeout(() => {
      setRefreshApproval((prev) => !prev)
      refetchBalance()
      refetchBalanceL3()
    }, 1000)
    setTimeout(() => {
      setRefreshApproval((prev) => !prev)
      refetchBalance()
      refetchBalanceL3()
    }, 5000)
    setTimeout(() => {
      refetchBalanceL3()
    }, 15000)
    setTimeout(() => {
      refetchBalanceL3()
    }, 20000)
    setTimeout(() => {
      refetchBalanceL3()
    }, 25000)
  }

  const onSubmit = async (data: any) => {
    approval ? handleDeposit(true) : handleApprove()
  }

  const handleBridgeBack = async () => {
    await handleDeposit(false)
  }

  const {
    data,
    isLoading,
    refetch: refetchBalance,
  } = useBalance({
    address,
    token: ERC20_CONTRACT_ADDRESS['lzrBTC'],
    chainId: arbitrumSepolia.id,
  })

  const {
    data: l3Data,
    isLoading: l3isLoading,
    refetch: refetchBalanceL3,
  } = useBalance({
    address,
    chainId: testnet.id,
  })

  return (
    <div className="flex flex-col gap-7">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-7">
        <div className="flex flex-col gap-[0.687rem] max-w-full">
          <div className="relative tracking-[-0.06em] leading-[1.25rem] mb-1">## BRIDGE lzrBTC TO BITLAZER</div>
          <Controller
            name="amount"
            control={control}
            rules={{
              required: 'Amount is required',
              min: { value: 0.0001, message: 'Amount must be greater than 0' },
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
          {chainId === arbitrumSepolia.id ? (
            <>
              <Button type="submit" disabled={!isValid || isWaitingForBridgeTx} aria-busy={isWaitingForBridgeTx}>
                {approval ? 'BRIDGE' : 'APPROVE'}
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
              SWITCH CHAIN
            </Button>
          )}
        </div>
      </form>
      <div className="h-px w-full bg-[#6c6c6c]"></div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleBridgeBack()
        }}
        className="flex flex-col gap-7"
      >
        <div className="flex flex-col gap-[0.687rem] max-w-full">
          <div className="relative tracking-[-0.06em] leading-[1.25rem] mb-1">## BRIDGE lzrBTC TO ARBITRUM</div>
          <div className="flex flex-row items-center justify-between gap-[1.25rem] text-gray-200">
            <div className="tracking-[-0.06em] leading-[1.25rem] inline-block">
              Balance:{' '}
              {l3isLoading ? 'Loading...' : `${formatEther(l3Data?.value.toString() || '0')} ${l3Data?.symbol}`}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-[0.687rem]">
          <Button link="https://bitlazer-sepolia.bridge.caldera.xyz/" target="_blank" className="w-auto uppercase">
            Bridge via Caldera
          </Button>
        </div>
      </form>
    </div>
  )
}

export default BridgeCrosschain
