import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export interface PriceState {
  btcPrice: number
  ethPrice: number
  btc24hChange: number | null
  isLoading: boolean
  lastUpdated: number | null
  error: string | null
  updatePrices: (btcPrice: number, ethPrice: number, btc24hChange?: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  resetPrices: () => void
}

export const usePriceStore = create<PriceState>()(
  subscribeWithSelector((set) => ({
    btcPrice: 0,
    ethPrice: 0,
    btc24hChange: null,
    isLoading: false,
    lastUpdated: null,
    error: null,

    updatePrices: (btcPrice: number, ethPrice: number, btc24hChange?: number) =>
      set({
        btcPrice,
        ethPrice,
        btc24hChange: btc24hChange ?? null,
        lastUpdated: Date.now(),
        error: null,
      }),

    setLoading: (loading: boolean) => set({ isLoading: loading }),

    setError: (error: string | null) => set({ error, isLoading: false }),

    resetPrices: () =>
      set({
        btcPrice: 0,
        ethPrice: 0,
        btc24hChange: null,
        isLoading: false,
        lastUpdated: null,
        error: null,
      }),
  })),
)
