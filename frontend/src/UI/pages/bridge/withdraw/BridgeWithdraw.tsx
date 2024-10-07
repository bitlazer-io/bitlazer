import { Button, InputField } from '@components/index'
import React, { FC } from 'react'
import { useForm, Controller } from 'react-hook-form'

interface IBridgeWithdraw {}

const BridgeWithdraw: FC<IBridgeWithdraw> = () => {
  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      amount: '',
    },
    mode: 'onChange',
  })

  const onSubmit = (data: any) => {
    console.log('Form Data:', data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-7">
      <div className="flex flex-col gap-[0.687rem] max-w-full">
        <div className="relative tracking-[-0.06em] leading-[1.25rem] mb-1">## WITHDRAW</div>
        <Controller
          name="amount"
          control={control}
          rules={{
            required: 'Amount is required',
            min: { value: 0.01, message: 'Amount must be greater than 0' },
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
        <Button type="submit" disabled={!isValid}>
          WITHDRAW
        </Button>
      </div>
    </form>
  )
}

export default BridgeWithdraw
