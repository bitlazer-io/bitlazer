import { Button, InputField, TXToast } from '@components/index'
import Loading from '@components/loading/Loading'
import React, { FC, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'
import { useBalance, useAccount, useReadContract } from 'wagmi'
import { waitForTransactionReceipt, writeContract } from '@wagmi/core'
import { stakeAdapter_abi } from 'src/assets/abi/stakeAdapter'
import { formatEther } from 'ethers/lib/utils'
import { mainnet } from 'src/web3/chains'
import { handleChainSwitch } from 'src/web3/functions'
import { config } from 'src/web3/config'
import { STAKING_CONTRACTS } from 'src/web3/contracts'
import { parseUnits } from 'viem'

interface IBridgeStake {}

const BridgeStake: FC<IBridgeStake> = () => {
  const { address, chainId } = useAccount()
  const [isStaking, setIsStaking] = useState(false)
  const [isUnstaking, setIsUnstaking] = useState(false)
  const [refreshData, setRefreshData] = useState(0)

  // Get user's wallet balance (native lzrBTC on Bitlazer)
  const { data: walletBalance, refetch: refetchWalletBalance } = useBalance({
    address: address,
    chainId: mainnet.id,
  })

  // Get user's staked balance (StakeAdapter balance - represents staked tokens)
  const { data: stakedBalance, refetch: refetchStakedBalance } = useReadContract({
    abi: stakeAdapter_abi,
    address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
    functionName: 'balanceOf',
    args: address ? [address] : ['0x0000000000000000000000000000000000000000'],
    chainId: mainnet.id,
    scopeKey: refreshData.toString(),
  })

  // Get pending rewards
  const { data: pendingRewards, refetch: refetchPendingRewards } = useReadContract({
    abi: stakeAdapter_abi,
    address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
    functionName: 'pendingReward',
    args: address ? [address] : ['0x0000000000000000000000000000000000000000'],
    chainId: mainnet.id,
    scopeKey: refreshData.toString(),
  })

  // Get APR
  const { data: apr } = useReadContract({
    abi: stakeAdapter_abi,
    address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
    functionName: 'getApy',
    args: [],
    chainId: mainnet.id,
  })

  // Get total staked (total supply of adapter tokens)
  const { data: totalStaked } = useReadContract({
    abi: stakeAdapter_abi,
    address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
    functionName: 'totalSupply',
    chainId: mainnet.id,
    scopeKey: refreshData.toString(),
  })

  const {
    handleSubmit: handleStakeSubmit,
    control: stakeControl,
    watch: stakeWatch,
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
    watch: unstakeWatch,
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
    setIsStaking(true)
    try {
      const amountToStake = parseUnits(data.stakeAmount, 18)

      // Execute the transaction with explicit gas to bypass estimation
      const txHash = await writeContract(config, {
        abi: stakeAdapter_abi,
        address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
        functionName: 'stake',
        args: [amountToStake],
        value: amountToStake, // For native token staking
        chainId: mainnet.id,
        account: address as `0x${string}`,
        gas: 300000n, // Provide explicit gas limit to bypass estimation
      } as any)

      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
      })

      if (receipt.status === 'success') {
        const wasRestaking = stakedBalance && Number(formatStakedAmount(stakedBalance as any)) > 0
        const message = wasRestaking ? 'Stake successful. Previous rewards have been claimed!' : 'Stake successful'
        toast(<TXToast {...{ message, txHash: receipt.transactionHash }} />, { autoClose: 7000 })
        stakeSetValue('stakeAmount', '')
        setRefreshData((prev) => prev + 1)
        setTimeout(() => {
          refetchWalletBalance()
          refetchStakedBalance()
          refetchPendingRewards()
        }, 1000)
      } else {
        toast(<TXToast {...{ message: 'Stake failed' }} />, { autoClose: 7000 })
      }
    } catch (error: any) {
      console.error('Staking error:', error)
      // Log detailed error info for debugging
      if (error?.cause) {
        console.error('Error cause:', error.cause)
      }
      // Check if user rejected the transaction
      if (error?.message?.includes('User rejected') || error?.message?.includes('User denied')) {
        toast(<TXToast {...{ message: 'Transaction rejected by user' }} />, { autoClose: 7000 })
      } else {
        // Extract meaningful error message
        let errorMessage = 'Failed to stake'
        if (error?.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas'
        } else if (error?.shortMessage) {
          errorMessage = error.shortMessage
        } else if (error?.message) {
          // Get first line of error message
          errorMessage = error.message.split('\n')[0].substring(0, 100)
        }
        toast(<TXToast {...{ message: errorMessage }} />, { autoClose: 7000 })
      }
    } finally {
      setIsStaking(false)
    }
  }

  const onUnstakeSubmit = async (data: any) => {
    setIsUnstaking(true)
    try {
      const amountToUnstake = parseUnits(data.unstakeAmount, 18)

      // Execute the transaction with explicit gas to bypass estimation
      const txHash = await writeContract(config, {
        abi: stakeAdapter_abi,
        address: STAKING_CONTRACTS.T3RNStakingAdapter as `0x${string}`,
        functionName: 'unstake',
        args: [amountToUnstake],
        value: 0n, // Explicitly set value to 0 for payable function
        chainId: mainnet.id,
        account: address as `0x${string}`,
        gas: 300000n, // Provide explicit gas limit to bypass estimation
      } as any)

      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
      })

      if (receipt.status === 'success') {
        toast(
          <TXToast
            {...{
              message: 'Unstake successful. Rewards have been automatically claimed!',
              txHash: receipt.transactionHash,
            }}
          />,
          { autoClose: 7000 },
        )
        unstakeSetValue('unstakeAmount', '')
        setRefreshData((prev) => prev + 1)
        setTimeout(() => {
          refetchWalletBalance()
          refetchStakedBalance()
          refetchPendingRewards()
        }, 1000)
      } else {
        toast(<TXToast {...{ message: 'Unstake failed' }} />, { autoClose: 7000 })
      }
    } catch (error: any) {
      console.error('Unstaking error:', error)
      // Log detailed error info for debugging
      if (error?.cause) {
        console.error('Error cause:', error.cause)
      }
      // Check if user rejected the transaction
      if (error?.message?.includes('User rejected') || error?.message?.includes('User denied')) {
        toast(<TXToast {...{ message: 'Transaction rejected by user' }} />, { autoClose: 7000 })
      } else if (error?.message?.includes('Insufficient balance for rewards')) {
        // Contract doesn't have enough balance to pay rewards
        toast(
          <TXToast
            {...{
              message:
                'Unable to unstake: The staking pool currently has insufficient funds for reward payouts. Please try again later or contact support.',
            }}
          />,
          { autoClose: 7000 },
        )
      } else {
        // Extract meaningful error message
        let errorMessage = 'Failed to unstake'
        if (error?.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas'
        } else if (error?.shortMessage) {
          errorMessage = error.shortMessage
        } else if (error?.message) {
          // Get first line of error message
          errorMessage = error.message.split('\n')[0].substring(0, 100)
        }
        toast(<TXToast {...{ message: errorMessage }} />, { autoClose: 7000 })
      }
    } finally {
      setIsUnstaking(false)
    }
  }

  const formatAPR = () => {
    if (!apr) return 'Loading...'
    try {
      // APR is returned as direct percentage value (not basis points)
      // getApy() returns 33333 which means 33,333%
      const aprNumber = Number(apr)
      return `${aprNumber.toLocaleString()}%`
    } catch {
      return 'Variable'
    }
  }

  const formatStakedAmount = (value: any) => {
    if (!value) return '0'
    try {
      return formatEther(value.toString())
    } catch {
      return '0'
    }
  }

  const formatRewardAmount = (value: any) => {
    if (!value || value === 0n) return '0'
    try {
      // Format without rounding to show all decimal places
      const formatted = formatEther(value.toString())
      const num = parseFloat(formatted)
      // Show up to 18 decimal places, removing trailing zeros
      if (num === 0) return '0'
      // For very small numbers, show up to 18 decimals
      if (num < 0.000001) {
        return formatted // Show the full precision
      }
      // For larger numbers, show up to 8 decimals
      return num.toFixed(8).replace(/\.?0+$/, '')
    } catch {
      return '0'
    }
  }

  return (
    <div className="flex flex-col gap-7">
      {/* Staking Stats Section */}
      <div className="flex flex-col gap-[0.687rem]">
        <label className="text-lightgreen-100">## STAKING OVERVIEW</label>
        <div className="p-3 bg-darkslategray-200 border border-lightgreen-100 rounded-[.115rem]">
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-row items-center justify-between text-gray-200 text-[14px]">
              <span className="tracking-[-0.04em]">YOUR STAKE</span>
              <span className="font-mono text-lightgreen-100">{formatStakedAmount(stakedBalance)} lzrBTC</span>
            </div>
            <div className="flex flex-row items-center justify-between text-gray-200 text-[14px] gap-2">
              <span className="tracking-[-0.04em] whitespace-nowrap">PENDING REWARDS</span>
              <span className="font-mono text-lightgreen-100 text-right break-all">
                {formatRewardAmount(pendingRewards)} lzrBTC
              </span>
            </div>
            <div className="flex flex-row items-center justify-between text-gray-200 text-[14px]">
              <span className="tracking-[-0.04em]">APR</span>
              <span className="font-mono text-lightgreen-100">{formatAPR()}</span>
            </div>
            <div className="flex flex-row items-center justify-between text-gray-200 text-[14px]">
              <span className="tracking-[-0.04em]">TOTAL POOL SIZE</span>
              <span className="font-mono text-lightgreen-100">{formatStakedAmount(totalStaked)} lzrBTC</span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-gray-600" />

      {/* Stake Form */}
      <form onSubmit={handleStakeSubmit(onStakeSubmit)} className="flex flex-col gap-7">
        <div className="flex flex-col gap-[0.687rem] max-w-full">
          <label className="text-lightgreen-100">## STAKE lzrBTC</label>
          <Controller
            name="stakeAmount"
            control={stakeControl}
            rules={{
              required: 'Amount is required',
              min: { value: 0.00001, message: 'Amount must be greater than 0.00001' },
              max: {
                value: walletBalance?.formatted || '0',
                message: 'Insufficient balance',
              },
            }}
            render={({ field }) => (
              <InputField
                placeholder="0.00"
                label="ENTER AMOUNT"
                type="number"
                {...field}
                error={stakeErrors.stakeAmount ? stakeErrors.stakeAmount.message : null}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
              />
            )}
          />
          <div className="flex flex-row items-center justify-between gap-[1.25rem] text-gray-200">
            <div className="tracking-[-0.06em] leading-[1.25rem] inline-block">
              Balance: {walletBalance ? formatEther(walletBalance.value.toString()) : '0'} lzrBTC
            </div>
            <button
              className="shadow-[1.8px_1.8px_1.84px_#66d560_inset] rounded-[.115rem] bg-darkolivegreen-200 flex flex-row items-start justify-start pt-[0.287rem] pb-[0.225rem] pl-[0.437rem] pr-[0.187rem] shrink-0 text-[0.813rem] text-lightgreen-100 disabled:opacity-40 disabled:pointer-events-none disabled:touch-none"
              onClick={(e) => {
                e.preventDefault()
                if (walletBalance) {
                  stakeSetValue('stakeAmount', formatEther(walletBalance.value.toString()))
                  stakeTrigger('stakeAmount')
                }
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
            <div className="relative tracking-[-0.06em] leading-[1.25rem] inline-block min-w-[4.188rem]">
              APR {formatAPR()}
            </div>
          </div>
          {chainId === mainnet.id ? (
            <Button
              type="submit"
              disabled={!isStakeValid || !stakeWatch('stakeAmount') || isStaking}
              aria-busy={isStaking}
            >
              {isStaking ? <Loading text="STAKING" /> : 'STAKE'}
            </Button>
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
      </form>

      {/* Divider */}
      {(<div className="h-px w-full bg-gray-600" />) as any}

      <form onSubmit={handleUnstakeSubmit(onUnstakeSubmit)} className="flex flex-col gap-7">
        <div className="flex flex-col gap-[0.687rem] max-w-full">
          <label className="text-lightgreen-100">## UNSTAKE lzrBTC</label>
          <Controller
            name="unstakeAmount"
            control={unstakeControl}
            rules={{
              required: 'Amount is required',
              min: { value: 0.00001, message: 'Amount must be greater than 0.00001' },
              max: {
                value: formatStakedAmount(stakedBalance),
                message: 'Insufficient staked balance',
              },
            }}
            render={({ field }) => (
              <InputField
                placeholder="0.00"
                label="ENTER AMOUNT"
                type="number"
                {...field}
                error={unstakeErrors.unstakeAmount ? unstakeErrors.unstakeAmount.message : null}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
              />
            )}
          />
          <div className="flex flex-row items-center justify-between gap-[1.25rem] text-gray-200">
            <div className="tracking-[-0.06em] leading-[1.25rem] inline-block">
              Staked: {formatStakedAmount(stakedBalance)} lzrBTC
            </div>
            <button
              className="shadow-[1.8px_1.8px_1.84px_#66d560_inset] rounded-[.115rem] bg-darkolivegreen-200 flex flex-row items-start justify-start pt-[0.287rem] pb-[0.225rem] pl-[0.437rem] pr-[0.187rem] shrink-0 text-[0.813rem] text-lightgreen-100 disabled:opacity-40 disabled:pointer-events-none disabled:touch-none"
              onClick={(e) => {
                e.preventDefault()
                if (stakedBalance) {
                  unstakeSetValue('unstakeAmount', formatStakedAmount(stakedBalance))
                  unstakeTrigger('unstakeAmount')
                }
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
            <div className="relative tracking-[-0.06em] leading-[1.25rem] inline-block min-w-[4.188rem] text-gray-200">
              * Unstaking will automatically claim your rewards
            </div>
          </div>
          {chainId === mainnet.id ? (
            <Button
              type="submit"
              disabled={!isUnstakeValid || !unstakeWatch('unstakeAmount') || isUnstaking}
              aria-busy={isUnstaking}
            >
              {isUnstaking ? <Loading text="UNSTAKING" /> : 'UNSTAKE'}
            </Button>
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
      </form>
    </div>
  )
}

export default BridgeStake
