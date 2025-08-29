import { useState, useEffect } from 'react'
import { usePublicClient } from 'wagmi'
import { arbitrum } from 'wagmi/chains'

interface WrapDetailsData {
  gasPrice: bigint | null
  isLoading: boolean
}

export const useWrapDetails = () => {
  const [wrapDetails, setWrapDetails] = useState<WrapDetailsData>({
    gasPrice: null,
    isLoading: true,
  })

  const arbitrumClient = usePublicClient({ chainId: arbitrum.id })

  useEffect(() => {
    const fetchWrapDetails = async () => {
      try {
        // Fetch current gas price from Arbitrum
        const gasPrice = await arbitrumClient?.getGasPrice()

        setWrapDetails({
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
