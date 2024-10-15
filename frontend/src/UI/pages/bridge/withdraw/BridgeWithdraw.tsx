import { Button, InputField } from '@components/index'
import React, { FC, useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { arbitrumSepolia } from 'wagmi/chains'
import { ERC20_CONTRACT_ADDRESS, L2_GATEWAY_ROUTER, TokenKeys } from '../../../../web3/contracts'
import { useAccount, useBalance, useSwitchChain } from 'wagmi'
import { ethers } from 'ethers'

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

  const [selectedToken, setSelectedToken] = useState<TokenKeys>('lbtc')
  const { switchChain } = useSwitchChain()
  const { address, isConnected, chainId, connector } = useAccount()

  // Inside your onSubmit function:
  const onSubmit = async (data: any) => {
    console.log('Form Data:', data)

    const amountFormatted = data.amount
    console.log('Amount:', amountFormatted)

    // Parse from string to BigNumber with ethers library
    const amountBN = ethers.utils.parseUnits(amountFormatted, 18)
    console.log('AmountBN:', amountBN.toString())

    // ABI of L2 Gateway Router
    const L2GatewayRouterABI = ['function depositERC20(uint256 amount)']

    if (!connector) {
      console.error('MetaMask connector is not available')
      return
    }

    const provider = await connector.getProvider()

    if (!provider) {
      console.error('Provider deliverd via Wagmi is not available')
      return
    }

    // Initialize ethers.js provider with MetaMask
    const web3Provider = new ethers.providers.Web3Provider(provider)

    // Request account access from MetaMask
    try {
      await web3Provider.send('eth_requestAccounts', [])
    } catch (error) {
      console.error('User denied MetaMask account access:', error)
      return
    }

    // Get the MetaMask signer (account) to send transactions
    const signer = web3Provider.getSigner()

    // Retrieve the selected MetaMask account (public address)
    const selectedAccount = await signer.getAddress()
    console.log(`Selected MetaMask account: ${selectedAccount}`)

    // Optionally, you can retrieve all accounts using web3Provider.listAccounts()
    const allAccounts = await web3Provider.listAccounts()
    console.log('All connected accounts:', allAccounts)

    // Create contract instances with the MetaMask signer
    const l2GatewayRouterContract = new ethers.Contract(L2_GATEWAY_ROUTER, L2GatewayRouterABI, signer)
    const l2ERC20Contract = new ethers.Contract(
      ERC20_CONTRACT_ADDRESS.lbtc,
      ['function approve(address spender, uint256 amount)'],
      signer,
    )

    try {
      // Approve L2 Gateway Router to spend tokens
      const approvalTx = await l2ERC20Contract.approve(L2_GATEWAY_ROUTER, amountBN)
      await approvalTx.wait()
      console.log('Approval successful')
    } catch (error) {
      console.error('Failed to approve:', error)
      return
    }

    try {
      // Perform the outbound transfer via L2 Gateway Router
      const tx = await l2GatewayRouterContract.depositERC20(amountBN)
      console.log(`Transaction hash: ${tx.hash}`)
      const receipt = await tx.wait()
      console.log(`Transaction was mined in block ${receipt.blockNumber}`)

      if (receipt.status === 1) {
        console.log('Transaction successful')
      }
    } catch (error) {
      console.error('Failed to perform transfer:', error)
    }
  }

  const { data, isLoading } = useBalance({
    address,
    token: ERC20_CONTRACT_ADDRESS[selectedToken],
  })

  useEffect(() => {
    const switchToArbitrumSepolia = async () => {
      if (isConnected && chainId !== arbitrumSepolia.id) {
        try {
          await switchChain({ chainId: arbitrumSepolia.id })
        } catch (error) {
          console.error('Failed to switch chains:', error)
        }
      }
    }

    switchToArbitrumSepolia()
  }, [chainId, isConnected, switchChain])

  return (
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
            Balance: {isLoading ? 'Loading...' : `${data?.formatted.toString()} ${data?.symbol}`}
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
          BRIDGE
        </Button>
      </div>
    </form>
  )
}

export default BridgeWithdraw
