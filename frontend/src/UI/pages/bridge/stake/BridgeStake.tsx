import { Button, InputField, TXToast } from '@components/index'
import React, { FC, useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'
import { useBalance, useAccount, useSwitchChain } from 'wagmi'
import { waitForTransactionReceipt, writeContract } from '@wagmi/core'
import { stakeLBTC_abi } from 'src/assets/abi/stakeLBTC'
import { formatEther, parseEther } from 'ethers/lib/utils'
import { devnet } from 'src/web3/chains'
import { config } from 'src/web3/config'
import Cookies from 'universal-cookie'

interface IBridgeStake {
  enabled: boolean
}

const BridgeStake: FC<IBridgeStake> = ({ enabled }) => {

  const { switchChain } = useSwitchChain()
  const { address, chainId } = useAccount()

  const userBalance = useBalance({
    address: address,
    chainId: devnet.id,
  })

  const {
    handleSubmit: handleStakeSubmit,
    control: stakeControl,
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
    setValue: unstakeSetValue,
    trigger: unstakeTrigger,
    formState: { errors: unstakeErrors, isValid: isUnstakeValid },
  } = useForm({
    defaultValues: {
      unstakeAmount: '',
    },
    mode: 'onChange',
  })

  const onStakeSubmit = async (data: any) => {
    console.log('Stake Data:', data)
    const args = {
      abi: stakeLBTC_abi,
      address: '0xD9A158f561E0DfD1842DF7A5c1549cD3D065d319',
      functionName: 'stake',
      args: [parseEther(data.stakeAmount)],
      value: parseEther(data.stakeAmount).toBigInt(),
    } as any;
    const txHash = await writeContract(config, args);
    const receipt = await waitForTransactionReceipt(config, {
      hash: txHash,
    })
    if (receipt.status === "success") {
      const txHash = receipt.transactionHash;
      toast(<TXToast {...{ message: "Stake successful", txHash }} />);
      const cookies = new Cookies();
      cookies.set('hasStaked', 'true', { path: '/' })
    } else {
      toast(<TXToast {... { message: "Stake failed" }} />);
    }
  }

  const onUnstakeSubmit = async (data: any) => {
    console.log('Unstake Data:', data)

    const args = {
      abi: stakeLBTC_abi,
      address: '0xD9A158f561E0DfD1842DF7A5c1549cD3D065d319',
      functionName: 'unstake',
      args: [parseEther(data.unstakeAmount)],
    } as any;

    const txHash = await writeContract(config, args);
    const receipt = await waitForTransactionReceipt(config, {
      hash: txHash,
    })
    if (receipt.status === "success") {
      const txHash = receipt.transactionHash;
      toast(<TXToast {...{ message: "Unstake successful", txHash }} />);
    } else {
      toast(<TXToast {... { message: "Unstake failed" }} />);
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="text-2xl font-bold text-red-500 text-center mb-4">Staking is not available yet</div>

      <form onSubmit={handleStakeSubmit(onStakeSubmit)} className="flex flex-col gap-7">
        <div className="flex flex-col gap-[0.687rem] max-w-full">
          <div className="relative tracking-[-0.06em] leading-[1.25rem] mb-1">## STAKE</div>
          <Controller
            name="stakeAmount"
            control={stakeControl}
            rules={{
              required: 'Amount is required',
              min: { value: 0.00001, message: 'Amount must be greater than 0.00001' },
            }}
            render={({ field }) => (
              <InputField
                placeholder="0.00"
                label="ENTER AMOUNT"
                type="number"
                {...field}
                error={stakeErrors.stakeAmount ? stakeErrors.stakeAmount.message : null}
                disabled={!enabled} // Disable input if not enabled
              />
            )}
          />
          <div className="flex flex-row items-center justify-between gap-[1.25rem] text-gray-200">
            <div className="tracking-[-0.06em] leading-[1.25rem] inline-block">Balance: {formatEther(userBalance.data?.value || "0")} LBTC</div>
            <button
              className="shadow-[1.8px_1.8px_1.84px_#66d560_inset] rounded-[.115rem] bg-darkolivegreen-200 flex flex-row items-start justify-start pt-[0.287rem] pb-[0.225rem] pl-[0.437rem] pr-[0.187rem] shrink-0 text-[0.813rem] text-lightgreen-100 disabled:opacity-40 disabled:pointer-events-none disabled:touch-none"
              disabled={!enabled}
              onClick={(e) => {
                e.preventDefault()
                stakeSetValue('stakeAmount', formatEther(userBalance.data?.value || '0'))
                stakeTrigger('stakeAmount')
              }}
            >
              <span className="relative tracking-[-0.06em] leading-[0.563rem] inline-block [text-shadow:0.2px_0_0_#66d560,_0_0.2px_0_#66d560,_-0.2px_0_0_#66d560,_0_-0.2px_0_#66d560] min-w-[1.75rem]">
                MAX
              </span>
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-[0.687rem]">
          <div className="flex flex-row items-center justify-between gap-[1.25rem]">
            <div className="relative tracking-[-0.06em] leading-[1.25rem] inline-block min-w-[4.188rem]">APY TBD%</div>
          </div>
          {
            chainId === devnet.id ? (
              <Button type="submit" disabled={!isStakeValid}>
                STAKE
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

      <div className="h-px w-full bg-[#6c6c6c]"></div>

      <form onSubmit={handleUnstakeSubmit(onUnstakeSubmit)} className="flex flex-col gap-7">
        <div className="flex flex-col gap-[0.687rem] max-w-full">
          <div className="relative tracking-[-0.06em] leading-[1.25rem] mb-1">## UNSTAKE</div>
          <Controller
            name="unstakeAmount"
            control={unstakeControl}
            rules={{
              required: 'Amount is required',
              min: { value: 0.00001, message: 'Amount must be greater than 0.00001' },
            }}
            render={({ field }) => (
              <InputField
                placeholder="0.00"
                label="ENTER AMOUNT"
                type="number"
                {...field}
                error={unstakeErrors.unstakeAmount ? unstakeErrors.unstakeAmount.message : null}
                disabled={!enabled}
              />
            )}
          />
          <div className="flex flex-row items-center justify-between gap-[1.25rem] text-gray-200">
            <div className="tracking-[-0.06em] leading-[1.25rem] inline-block">Balance: {formatEther(userBalance.data?.value || "0")} LBTC</div>
            <button
              className="shadow-[1.8px_1.8px_1.84px_#66d560_inset] rounded-[.115rem] bg-darkolivegreen-200 flex flex-row items-start justify-start pt-[0.287rem] pb-[0.225rem] pl-[0.437rem] pr-[0.187rem] shrink-0 text-[0.813rem] text-lightgreen-100 disabled:opacity-40 disabled:pointer-events-none disabled:touch-none"
              disabled={!enabled}
              onClick={(e) => {
                e.preventDefault()
                unstakeSetValue('unstakeAmount', formatEther(userBalance.data?.value || '0'))
                unstakeTrigger('unstakeAmount')
              }}
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
              <Button type="submit" disabled={!isUnstakeValid && !enabled}>
                UNSTAKE
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

export default BridgeStake
