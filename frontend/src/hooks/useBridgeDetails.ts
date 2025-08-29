import { useState, useEffect } from 'react'
import { usePublicClient } from 'wagmi'
import { arbitrum } from 'wagmi/chains'
import { BRIDGE_CONFIG, formatBridgeTime } from '../config/bridge'

interface BridgeDetailsData {
  bridgeTime: string
  protocol: string
  gasPrice: bigint | null
  isLoading: boolean
}

export const useBridgeDetails = (isBridgeMode: boolean) => {
  const [bridgeDetails, setBridgeDetails] = useState<BridgeDetailsData>({
    bridgeTime: isBridgeMode
      ? formatBridgeTime(BRIDGE_CONFIG.ARBITRUM_TO_BITLAZER_TIME)
      : formatBridgeTime(BRIDGE_CONFIG.BITLAZER_TO_ARBITRUM_TIME),
    protocol: BRIDGE_CONFIG.PROTOCOL_NAME,
    gasPrice: null,
    isLoading: true,
  })

  const arbitrumClient = usePublicClient({ chainId: arbitrum.id })

  useEffect(() => {
    const fetchBridgeDetails = async () => {
      try {
        // Fetch current gas price from Arbitrum
        const gasPrice = await arbitrumClient?.getGasPrice()

        // Calculate dynamic values
        const bridgeTime = isBridgeMode
          ? formatBridgeTime(BRIDGE_CONFIG.ARBITRUM_TO_BITLAZER_TIME)
          : formatBridgeTime(BRIDGE_CONFIG.BITLAZER_TO_ARBITRUM_TIME)

        setBridgeDetails({
          bridgeTime,
          protocol: BRIDGE_CONFIG.PROTOCOL_NAME,
          gasPrice: gasPrice || null,
          isLoading: false,
        })
      } catch (error) {
        console.error('Error fetching bridge details:', error)
        setBridgeDetails((prev) => ({
          ...prev,
          isLoading: false,
        }))
      }
    }

    fetchBridgeDetails()

    // Update every 30 seconds to keep gas prices fresh
    const interval = setInterval(fetchBridgeDetails, 30000)

    return () => clearInterval(interval)
  }, [arbitrumClient, isBridgeMode])

  return bridgeDetails
}
