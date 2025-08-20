import { Button, InputField, TXToast } from '@components/index'
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

interface IBridgeWrap {}

const BridgeWrap: FC<IBridgeWrap> = () => {
  const [selectedToken] = useState<TokenKeys>('wbtc')
  const [selectedTokenUnwrap] = useState<TokenKeys>('wbtc')
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
          requiredApproval = parseUnits(amount, 8)
        } else {
          requiredApproval = parseUnits(amount, 18)
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
      amountForApproval = parseUnits(amount, 8)
    } else {
      amountForApproval = parseUnits(amount, 18)
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
      amountToSend = parseUnits(amount, 8)
    } else {
      amountToSend = parseUnits(amount, 18)
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
      amountToSend = parseUnits(amount, 18)
    } else {
      amountToSend = parseUnits(amount, 18)
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
    approval ? handleDeposit() : handleApprove()
  }

  return (
    <div className="flex flex-col gap-7">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-7">
        <div className="flex flex-col relative gap-[0.75rem]">
          <label className="text-lightgreen-100">## WRAP {selectedToken.toUpperCase()} TO lzrBTC</label>
          <div className="font-ocrx w-full pt-3 rounded-[.115rem] h-[2.875rem] text-lightgreen-100 text-[1.25rem] whitespace-nowrap bg-darkslategray-200 flex border border-solid border-lightgreen-100 ">
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
              min: { value: 0.00001, message: 'Amount must be greater than 0.00001' },
              max: {
                value: balanceData?.formatted || '0',
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
              Balance:{' '}
              {balanceLoading ? 'Loading...' : `${balanceData?.formatted || '0'} ${selectedToken.toUpperCase()}`}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault()
                setValue('amount', balanceData?.formatted || '0')
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
              {/* Only show reset if allowance is wrong and NOT due to decimals conversion */}
              {approvalData &&
                selectedToken === 'wbtc' &&
                !decimalsConversion && // Only show reset if conversion is NOT enabled
                BigInt(approvalData) > BigInt(balanceData?.value || 0) && (
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
                    className="bg-red-600"
                  >
                    RESET ALLOWANCE (Required)
                  </Button>
                )}
              <Button
                type="submit"
                disabled={
                  !isValid ||
                  !watch('amount') ||
                  watch('amount') === '' ||
                  isLoadingApproval ||
                  isApproving ||
                  isWrapping
                }
              >
                {approval ? (
                  isWrapping ? (
                    <Loading text="WRAPPING" />
                  ) : (
                    'WRAP'
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
          <div className="font-ocrx w-full pt-3 rounded-[.115rem] h-[2.875rem] text-lightgreen-100 text-[1.25rem] whitespace-nowrap bg-darkslategray-200 flex border border-solid border-lightgreen-100 ">
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
              min: { value: 0.00001, message: 'Amount must be greater than 0.00001' },
              max: {
                value: parseFloat(lzrBTCBalanceData?.formatted || '0'),
                message: 'Insufficient balance',
              },
            }}
            render={({ field }) => (
              <InputField
                placeholder="0.00"
                label="ENTER AMOUNT"
                type="number"
                {...field}
                error={unwrapErrors.amount ? unwrapErrors.amount.message : null}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
              />
            )}
          />
          <div className="flex flex-row items-center justify-between gap-[1.25rem] text-gray-200">
            <div className="tracking-[-0.06em] leading-[1.25rem] inline-block">
              Balance: {lzrBTCBalanceLoading ? 'Loading...' : `${lzrBTCBalanceData?.formatted || '0'} lzrBTC`}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault()
                unwrapSetValue('amount', lzrBTCBalanceData?.formatted || '0')
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
            <Button
              type="submit"
              disabled={
                !isUnwrapValid ||
                !unwrapWatch('amount') ||
                unwrapWatch('amount') === '' ||
                !lzrBTCBalanceData?.value ||
                lzrBTCBalanceData.value === 0n ||
                isUnwrapping
              }
            >
              {isUnwrapping ? <Loading text="UNWRAPPING" /> : 'UNWRAP'}
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
              SWITCH TO ARBITRUM
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
