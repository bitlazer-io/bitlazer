import { Button, InputField } from '@components/index'
import React, { FC, useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'

import { useWriteContract, useBalance, useAccount } from 'wagmi'
import { stakeLBTC_abi } from 'src/assets/abi/stakeLBTC'
import { arbitrum, sepolia } from 'wagmi/chains'

interface IBridgeStake { }

const BridgeStake: FC<IBridgeStake> = () => {
  const {
    handleSubmit: handleStakeSubmit,
    control: stakeControl,
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
    formState: { errors: unstakeErrors, isValid: isUnstakeValid },
  } = useForm({
    defaultValues: {
      unstakeAmount: '',
    },
    mode: 'onChange',
  })

  const onStakeSubmit = (data: any) => {
    console.log('Stake Data:', data)
    writeContract({
      abi: stakeLBTC_abi,
      address: '0xD9A158f561E0DfD1842DF7A5c1549cD3D065d319',
      functionName: 'stake',
      args: [
        BigInt(data.stakeAmount * 10 ** 18),
      ],
      value: BigInt(data.stakeAmount * 10 ** 18),
    })
  }

  const onUnstakeSubmit = (data: any) => {
    console.log('Unstake Data:', data)
    writeContract({
      abi: stakeLBTC_abi,
      address: '0xD9A158f561E0DfD1842DF7A5c1549cD3D065d319',
      functionName: 'unstake',
      args: [
        BigInt(data.unstakeAmount * 10 ** 18),
      ]
    })
  }

  const { isConnected, address } = useAccount()
  const { writeContract } = useWriteContract()

  return (
    <div className="flex flex-col gap-7">
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
              />
            )}
          />
          <div className="flex flex-row items-center justify-between gap-[1.25rem] text-gray-200">
            <div className="tracking-[-0.06em] leading-[1.25rem] inline-block">
              Balance: 2,321.99 WBTC
            </div>
            <button className="shadow-[1.8px_1.8px_1.84px_#66d560_inset] rounded-[.115rem] bg-darkolivegreen-200 flex flex-row items-start justify-start pt-[0.287rem] pb-[0.225rem] pl-[0.437rem] pr-[0.187rem] shrink-0 text-[0.813rem] text-lightgreen-100 disabled:opacity-40 disabled:pointer-events-none disabled:touch-none">
              <span className="relative tracking-[-0.06em] leading-[0.563rem] inline-block [text-shadow:0.2px_0_0_#66d560,_0_0.2px_0_#66d560,_-0.2px_0_0_#66d560,_0_-0.2px_0_#66d560] min-w-[1.75rem]">
                MAX
              </span>
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-[0.687rem]">
          <div className="flex flex-row items-center justify-between gap-[1.25rem]">
            <div className="relative tracking-[-0.06em] leading-[1.25rem] inline-block min-w-[4.188rem]">
              APY 2.8%
            </div>
          </div>
          <Button type="submit" disabled={!isStakeValid}>
            STAKE
          </Button>
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
              />
            )}
          />
          <div className="flex flex-row items-center justify-between gap-[1.25rem] text-gray-200">
            <div className="tracking-[-0.06em] leading-[1.25rem] inline-block">
              Balance: 2,321.99 WBTC
            </div>
            <button className="shadow-[1.8px_1.8px_1.84px_#66d560_inset] rounded-[.115rem] bg-darkolivegreen-200 flex flex-row items-start justify-start pt-[0.287rem] pb-[0.225rem] pl-[0.437rem] pr-[0.187rem] shrink-0 text-[0.813rem] text-lightgreen-100 disabled:opacity-40 disabled:pointer-events-none disabled:touch-none">
              <span className="relative tracking-[-0.06em] leading-[0.563rem] inline-block [text-shadow:0.2px_0_0_#66d560,_0_0.2px_0_#66d560,_-0.2px_0_0_#66d560,_0_-0.2px_0_#66d560] min-w-[1.75rem]">
                MAX
              </span>
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-[0.687rem]">
          <div className="flex flex-row items-center justify-between gap-[1.25rem]">
            <div className="relative tracking-[-0.06em] leading-[1.25rem] inline-block min-w-[4.188rem]">
              APY 2.8%
            </div>
          </div>
          <Button type="submit" disabled={!isUnstakeValid}>
            UNSTAKE
          </Button>
        </div>
      </form>
    </div>
  )
}

export default BridgeStake
