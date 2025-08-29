import { useState, useEffect } from 'react'
import { usePublicClient } from 'wagmi'
import { arbitrum } from 'wagmi/chains'

interface WrapDetailsData {
  networkFee: string
  gasPrice: bigint | null
  isLoading: boolean
}

export const useWrapDetails = () => {
  const [wrapDetails, setWrapDetails] = useState<WrapDetailsData>({
    networkFee: '~$0.01',
    gasPrice: null,
    isLoading: true,
  })

  const arbitrumClient = usePublicClient({ chainId: arbitrum.id })

  useEffect(() => {
    const fetchWrapDetails = async () => {
      try {
        // Fetch current gas price from Arbitrum
        const gasPrice = await arbitrumClient?.getGasPrice()

        // Calculate network fee for ERC-20 transaction (much lower than bridge)
        let networkFee = '~$0.01' // Fallback

        if (gasPrice) {
          try {
            // ERC-20 wrap/unwrap typically uses ~50,000 gas
            const wrapGasLimit = 50000n
            const gasCostWei = gasPrice * wrapGasLimit
            const gasCostEth = Number(gasCostWei) / 1e18

            // Assume ETH around $2500 for USD conversion
            const ethPriceUsd = 2500
            const gasCostUsd = gasCostEth * ethPriceUsd

            // Format as cents for small fees
            if (gasCostUsd < 0.01) {
              networkFee = '<$0.01'
            } else if (gasCostUsd < 0.1) {
              networkFee = `~$${gasCostUsd.toFixed(2)}`
            } else {
              networkFee = `~$${gasCostUsd.toFixed(1)}`
            }
          } catch (error) {
            console.error('Error calculating wrap fee:', error)
          }
        }

        setWrapDetails({
          networkFee,
          gasPrice: gasPrice || null,
          isLoading: false,
        })
      } catch (error) {
        console.error('Error fetching wrap details:', error)
        setWrapDetails((prev) => ({
          ...prev,
          isLoading: false,
        }))
      }
    }

    fetchWrapDetails()

    // Update every 30 seconds to keep gas prices fresh
    const interval = setInterval(fetchWrapDetails, 30000)

    return () => clearInterval(interval)
  }, [arbitrumClient])

  return wrapDetails
}
