import { Button, InputField, TXToast } from '@components/index'
import React, { FC, useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useAccount, useBalance, useReadContract, useSwitchChain } from 'wagmi'
import { erc20Abi } from 'viem'
import { waitForTransactionReceipt, writeContract } from '@wagmi/core'
import { arbitrum, mainnet } from 'wagmi/chains'
import { config } from 'src/web3/config'
import { ERC20_CONTRACT_ADDRESS, TokenKeys, WRAP_CONTRACT } from 'src/web3/contracts'
import { lzrBTC_abi } from 'src/assets/abi/lzrBTC'
import { parseEther, formatEther } from 'ethers/lib/utils'
import { toast } from 'react-toastify'
import { BigNumber } from 'ethers/lib/ethers'
import Cookies from 'universal-cookie'
import { handleChainSwitch } from 'src/web3/functions'
import { use } from 'i18next'

interface IBridgeWrap {}

const BridgeWrap: FC<IBridgeWrap> = () => {
  const [selectedToken, setSelectedToken] = useState<TokenKeys>('wbtc')
  const [selectedTokenUnwrap, setSelectedTokenUnwrap] = useState<TokenKeys>('wbtc')
  const { switchChain } = useSwitchChain()
  const { address, isConnected, chainId } = useAccount()
  const [approval, setApproval] = useState<boolean>(false)
  const [refresh, setRefresh] = useState<boolean>(false)
  const [reverseApproval, setReverseApproval] = useState<boolean>(false)
  const [holderBalance, setHolderBalance] = useState<string | undefined>(undefined)

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    getValues,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      amount: '',
    },
    mode: 'onChange',
  })

  const {
    handleSubmit: handleUnwrapSubmit,
    control: unwrapControl,
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

  const { data: wbtcBalance, isLoading: wbtcBalanceLoading } = useBalance({
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

  const { data: reverseApprovalData } = useReadContract({
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

  useEffect(() => {
    if (selectedTokenUnwrap === 'wbtc') {
      setHolderBalance(wbtcHolderBalance as string)
    }
  }, [selectedTokenUnwrap, wbtcHolderBalance])

  useEffect(() => {
    if (approvalData !== undefined) {
      if (BigNumber.from(approvalData).gte(parseEther(getValues('amount') || '0'))) {
        setApproval(true)
      } else {
        setApproval(false)
      }
    }
  }, [approvalData, watch('amount'), refresh])

  const handleApprove = async () => {
    const approvalArgs = {
      abi: lzrBTC_abi,
      address: ERC20_CONTRACT_ADDRESS[selectedToken],
      functionName: 'approve',
      args: [WRAP_CONTRACT, parseEther(getValues('amount'))],
    }

    let approvalTransactionHash
    try {
      approvalTransactionHash = await writeContract(config, approvalArgs)
    } catch (error) {
      console.log('Error: ', error)
      toast(<TXToast {...{ message: 'Approval failed', error }} />)
      return
    }
    const approvalReceipt = await waitForTransactionReceipt(config, {
      hash: approvalTransactionHash,
    })
    setRefresh((prev) => !prev)
    if (approvalReceipt.status === 'success') {
      const txHash = approvalReceipt.transactionHash
      toast(<TXToast {...{ message: 'Approval successful', txHash }} />)
    } else {
      toast(<TXToast {...{ message: 'Transaction failed' }} />)
    }
    setApproval(true)
  }

  const handleDeposit = async () => {
    const args = {
      abi: lzrBTC_abi,
      address: WRAP_CONTRACT,
      functionName: 'mint',
      args: [parseEther(getValues('amount')), ERC20_CONTRACT_ADDRESS[selectedToken]],
    } as any

    try {
      const transactionHash = await writeContract(config, args)
      const receipt = await waitForTransactionReceipt(config, {
        hash: transactionHash,
      })
      if (receipt.status === 'success') {
        const txHash = receipt.transactionHash
        toast(<TXToast {...{ message: 'Wrap successful', txHash }} />)
        const cookies = new Cookies()
        cookies.set('hasWrapped', 'true', { path: '/' })
      } else {
        toast(<TXToast {...{ message: 'Wrap failed' }} />)
      }
    } catch (error: any) {
      console.log('Error: ', error)
      if (!error.message.includes('User rejected the request.')) {
        toast(<TXToast {...{ message: 'Failed to Wrap.' }} />)
        console.log(error.message)
      } else {
        toast(<TXToast {...{ message: 'Transaction Rejected.' }} />)
      }
    }
    setTimeout(() => {
      setRefresh((prev) => !prev)
    }, 1000)
  }

  const handleUnwrap = async () => {
    const args = {
      abi: lzrBTC_abi,
      address: WRAP_CONTRACT,
      functionName: 'burn',
      args: [parseEther(unwrapGetValues('amount')), ERC20_CONTRACT_ADDRESS[selectedTokenUnwrap]],
    } as any

    try {
      const transactionHash = await writeContract(config, args)
      const receipt = await waitForTransactionReceipt(config, {
        hash: transactionHash,
      })
      if (receipt.status === 'success') {
        const txHash = receipt.transactionHash
        toast(<TXToast {...{ message: 'Deposit successful', txHash }} />)
        const cookies = new Cookies()
        cookies.set('hasWrapped', 'true', { path: '/' })
      } else {
        toast(<TXToast {...{ message: 'Unwrap failed' }} />)
      }
    } catch (error: any) {
      if (!error.message.includes('User rejected the request.')) {
        toast(<TXToast {...{ message: 'Failed to Unwrap' }} />)
      } else {
        toast(<TXToast {...{ message: 'Transaction Rejected.' }} />)
      }
    }
    setTimeout(() => {
      setRefresh((prev) => !prev)
    }, 1000)
  }

  const onSubmit = async (data: any) => {
    approval ? handleDeposit() : handleApprove()
  }

  return (
    <div className="flex flex-col gap-7">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-7">
        <div className="flex flex-col relative gap-[0.75rem]">
          <label className="text-lightgreen-100">## WRAP {selectedToken.toUpperCase()} TO lzrBTC</label>
          <div className="font-ocrx w-full rounded-[.115rem] h-[2.875rem] text-lightgreen-100 text-[1.25rem] whitespace-nowrap bg-darkslategray-200 flex border border-solid border-lightgreen-100 ">
            <div className="flex-1 flex items-center justify-center h-full">
              <span className="text-lightgreen-100">WBTC</span>
            </div>
            <div className="flex items-center justify-center h-full">
              <span className="text-lightgreen-100 mx-2">→</span>
            </div>

            <div className="flex-1 flex items-center justify-center h-full">
              <span className="text-lightgreen-100">lzrBTC</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[0.687rem] max-w-full">
          <Controller
            name="amount"
            control={control}
            rules={{
              required: 'Amount is required',
              min: { value: 0.001, message: 'Amount must be greater than 0.001' },
              max: {
                value: formatEther(balanceData?.value.toString() || '0'),
                message: 'Amount must be less than balance',
              },
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
              Balance:{' '}
              {balanceLoading
                ? 'Loading...'
                : `${formatEther(balanceData?.value.toString() || '0')} ${selectedToken.toUpperCase()}`}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault()
                setValue('amount', formatEther(balanceData?.value.toString() || '0'))
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
              <Button type="submit" disabled={!isValid || isLoadingApproval}>
                {approval ? 'WRAP' : 'APPROVE'}
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
          handleUnwrap()
        }}
        className="flex flex-col gap-7"
      >
        <div className="flex flex-col relative gap-[0.75rem]">
          <label className="text-lightgreen-100">## UNWRAP lzrBTC TO {selectedTokenUnwrap.toUpperCase()}</label>
          <div className="font-ocrx w-full rounded-[.115rem] h-[2.875rem] text-lightgreen-100 text-[1.25rem] whitespace-nowrap bg-darkslategray-200 flex border border-solid border-lightgreen-100 ">
            <div className="flex-1 flex items-center justify-center h-full">
              <span className="text-lightgreen-100">lzrBTC</span>
            </div>
            <div className="flex items-center justify-center h-full">
              <span className="text-lightgreen-100 mx-2">→</span>
            </div>

            <div className="flex-1 flex items-center justify-center h-full">
              <span className="text-lightgreen-100">WBTC</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[0.687rem] max-w-full">
          <Controller
            name="amount"
            control={unwrapControl}
            rules={{
              required: 'Amount is required',
              min: { value: 0.001, message: 'Amount must be greater than 0.001' },
              max: {
                value: formatEther(holderBalance?.toString() || '0'),
                message: 'Amount must be less than balance',
              },
            }}
            render={({ field }) => (
              <InputField
                placeholder="0.00"
                label="ENTER AMOUNT"
                type="number"
                {...field}
                error={unwrapErrors.amount ? unwrapErrors.amount.message : null}
              />
            )}
          />
          <div className="flex flex-row items-center justify-between gap-[1.25rem] text-gray-200">
            <div className="tracking-[-0.06em] leading-[1.25rem] inline-block">
              Balance: {lzrBTCBalanceLoading ? 'Loading...' : `${formatEther(holderBalance?.toString() || '0')} lzrBTC`}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault()
                unwrapSetValue('amount', formatEther(holderBalance?.toString() || '0'))
                unwrapTrigger('amount')
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
          {/* <div className="flex flex-row items-center justify-between gap-[1.25rem]">
          <div className="relative tracking-[-0.06em] leading-[1.25rem] inline-block min-w-[4.188rem]">GAS FEE</div>
          <div className="w-[2.75rem] relative tracking-[-0.06em] leading-[1.25rem] text-right inline-block">00.00</div>
        </div> */}
          {chainId === arbitrum.id ? (
            <Button type="submit" disabled={!isUnwrapValid || holderBalance === '0'}>
              UNWRAP
            </Button>
          ) : (
            // <>
            //   {
            //     (selectedToken === 'abtc' && BigNumber.from(abtcUnwrapAllowance).gte(unwrapGetValues("amount")))
            //       || (selectedToken === 'tbtc' && BigNumber.from(tbtcUnwrapAllowance).gte(unwrapGetValues("amount")))
            //       || (selectedToken === 'wbtc' && BigNumber.from(wbtcUnwrapAllowance).gte(unwrapGetValues("amount")))
            //       ? (
            //         <Button type="submit" disabled={!isValid}>
            //           UNWRAP
            //         </Button>
            //       ) : (
            //         <Button type="submit">
            //           APPROVE
            //         </Button>
            //       )
            //   }
            // </>
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
          {/* <div className="h-[0.688rem] relative tracking-[-0.06em] leading-[1.25rem] text-gray-200 inline-block">
          Transaction number
        </div> */}
        </div>
      </form>
    </div>
  )
}

export default BridgeWrap
