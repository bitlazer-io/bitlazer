import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export interface PriceState {
  btcPrice: number
  ethPrice: number
  isLoading: boolean
  lastUpdated: number | null
  error: string | null
  updatePrices: (btcPrice: number, ethPrice: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  resetPrices: () => void
}

export const usePriceStore = create<PriceState>()(
  subscribeWithSelector((set) => ({
    btcPrice: 0,
    ethPrice: 0,
    isLoading: false,
    lastUpdated: null,
    error: null,

    updatePrices: (btcPrice: number, ethPrice: number) =>
      set({
        btcPrice,
        ethPrice,
        lastUpdated: Date.now(),
        error: null,
      }),

    setLoading: (loading: boolean) => set({ isLoading: loading }),

    setError: (error: string | null) => set({ error, isLoading: false }),

    resetPrices: () =>
      set({
        btcPrice: 0,
        ethPrice: 0,
        isLoading: false,
        lastUpdated: null,
        error: null,
      }),
  })),
)
