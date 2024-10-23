import { Button, InputField, TXToast } from '@components/index'
import React, { FC, useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { arbitrumSepolia } from 'wagmi/chains'
import { ERC20_CONTRACT_ADDRESS, L2_GATEWAY_ROUTER, TokenKeys } from '../../../../web3/contracts'
import { useAccount, useBalance, useReadContract, useSwitchChain } from 'wagmi'
import { writeContract, waitForTransactionReceipt, simulateContract } from '@wagmi/core'
import { BigNumber, ethers } from 'ethers'
import { toast } from 'react-toastify'
import { formatEther, parseEther } from 'ethers/lib/utils'
import { config } from 'src/web3/config'
import { LBTC_abi } from 'src/assets/abi/lbtc'
import Cookies from 'universal-cookie'
import { devnet } from 'src/web3/chains'

interface IBridgeWithdraw { }

const BridgeWithdraw: FC<IBridgeWithdraw> = () => {
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

  const [selectedToken, setSelectedToken] = useState<TokenKeys>('lbtc')
  const { switchChain } = useSwitchChain()
  const { address, isConnected, chainId, connector } = useAccount()
  const [approval, setApproval] = useState<boolean>(false)

  const { data: approvalData } = useReadContract({
    abi: LBTC_abi,
    address: ERC20_CONTRACT_ADDRESS['lbtc'],
    functionName: 'allowance',
    args: [address, L2_GATEWAY_ROUTER],
    chainId: arbitrumSepolia.id,
  })

  useEffect(() => {
    if (approvalData) {
      const approvalAmount = approvalData as unknown as string;
      if (BigNumber.from(approvalAmount).gte(parseEther(getValues("amount") || '0'))) {
        setApproval(true);
      } else {
        setApproval(false);
      }
    } else {
      console.log('Approval data not found')
    }
  }, [approvalData, watch('amount')])

  const handleApprove = async () => {
    const approvalArgs = {
      abi: LBTC_abi,
      address: ERC20_CONTRACT_ADDRESS['lbtc'],
      functionName: 'approve',
      args: [L2_GATEWAY_ROUTER, parseEther(getValues("amount"))],
    }
    const approvalTransactionHash = await writeContract(config, approvalArgs);
    const approvalReceipt = await waitForTransactionReceipt(config, {
      hash: approvalTransactionHash,
    })
    if (approvalReceipt.status === "success") {
      const txHash = approvalReceipt.transactionHash;
      toast(<TXToast {...{ message: "Approval successful", txHash }} />);
    } else {
      toast(<TXToast {... { message: "Approval failed" }} />);
    }
  }

  const handleDeposit = async () => {
    if (!connector) {
      return
    }
    const provider = await connector.getProvider()
    if (!provider) {
      return
    }
    const web3Provider = new ethers.providers.Web3Provider(provider)
    const signer = web3Provider.getSigner()
    const L2GatewayRouterABI = ['function depositERC20(uint256 amount)']
    const l2GatewayRouterContract = new ethers.Contract(L2_GATEWAY_ROUTER, L2GatewayRouterABI, signer)
    try {
      // Perform the outbound transfer via L2 Gateway Router
      const tx = await l2GatewayRouterContract.depositERC20(parseEther(getValues("amount")))
      const receipt = await tx.wait()

      if (receipt.status === 1) {
        const txHash = receipt.transactionHash;
        toast(<TXToast {...{ message: "Bridge successful", txHash }} />);
        const cookies = new Cookies();
        cookies.set('hasBridged', 'true', { path: '/' })
      } else {
        toast(<TXToast {... { message: "Bridge failed" }} />);
      }
    } catch (error) {
      toast(<TXToast {... { message: "Failed to Bridge tokens" }} />);
    }

    // const depositArgs = {
    //   abi: ['function depositERC20(uint256 amount)'],
    //   address: L2_GATEWAY_ROUTER,
    //   functionName: 'depositERC20',
    //   args: [parseEther(getValues("amount"))],
    // } as any;

    // try {
    //   simulateContract(config, depositArgs)
    // } catch (error) {
    //   console.error('Failed to simulate:', error)
    // }

    // try {
    //   const transactionHash = await writeContract(config, depositArgs)
    //   const receipt = await waitForTransactionReceipt(config, {
    //     hash: transactionHash,
    //   })
    //   if (receipt.status === "success") {
    //     toast.success('Bridge successful');
    //   } else {
    //     toast.error('Bridge failed');
    //   }
    // } catch (error) {
    //   toast.error('Failed to bridge:', error as any)
    // }
  }

  // Inside your onSubmit function:
  const onSubmit = async (data: any) => {
    approval ? handleDeposit() : handleApprove()
  }

  const handleBridgeBack = async () => {
    await handleDeposit();
  }

  const { data, isLoading } = useBalance({
    address,
    token: ERC20_CONTRACT_ADDRESS['lbtc'],
    chainId: arbitrumSepolia.id,
  })

  const { data: l3Data, isLoading: l3isLoading } = useBalance({
    address,
    chainId: devnet.id,
  })

  return (
    <div className="flex flex-col gap-7">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-7">
        <div className="flex flex-col gap-[0.687rem] max-w-full">
          <div className="relative tracking-[-0.06em] leading-[1.25rem] mb-1">## BRIDGE</div>
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
              />
            )}
          />
          <div className="flex flex-row items-center justify-between gap-[1.25rem] text-gray-200">
            <div className="tracking-[-0.06em] leading-[1.25rem] inline-block">
              Balance: {isLoading ? 'Loading...' : `${formatEther(data?.value.toString() || "0")} ${data?.symbol}`}
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
          {
            chainId === arbitrumSepolia.id ? (
              <>
                {
                  approval ? (
                    <Button type="submit" disabled={!isValid}>
                      BRIDGE
                    </Button>
                  ) : (
                    <Button type="submit">
                      APPROVE
                    </Button>
                  )
                }
              </>
            ) : (
              <Button type="submit" onClick={(e) => {
                e.preventDefault()
                switchChain({ chainId: arbitrumSepolia.id })
              }}>
                SWITCH CHAIN
              </Button>
            )
          }
        </div>
      </form>
      <div className="h-px w-full bg-[#6c6c6c]"></div>
      <form onSubmit={(e) => {
        e.preventDefault();
        handleBridgeBack();
      }} className="flex flex-col gap-7">
        <div className="flex flex-col gap-[0.687rem] max-w-full">
          <div className="relative tracking-[-0.06em] leading-[1.25rem] mb-1">## BRIDGE BACK</div>
          <Controller
            name="amount"
            control={unstakeControl}
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
                error={unstakeErrors.amount ? unstakeErrors.amount.message : null}
              />
            )}
          />
          <div className="flex flex-row items-center justify-between gap-[1.25rem] text-gray-200">
            <div className="tracking-[-0.06em] leading-[1.25rem] inline-block">
              Balance: {l3isLoading ? 'Loading...' : `${formatEther(l3Data?.value.toString() || "0")} ${l3Data?.symbol}`}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault()
                unstakeSetValue('amount', formatEther(l3Data?.value.toString() || '0'))
                unstakeTrigger('amount')
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
          {
            chainId === devnet.id ? (
              <Button type="submit" disabled={!unstakeIsValid}>
                BRIDGE
              </Button>
            ) : (
              <Button type="submit" onClick={(e) => {
                e.preventDefault()
                switchChain({ chainId: devnet.id })
              }}>
                SWITCH CHAIN
              </Button>
            )
          }
        </div>
      </form>
    </div>
  )
}

export default BridgeWithdraw
