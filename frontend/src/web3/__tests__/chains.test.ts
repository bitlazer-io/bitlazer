import { describe, it, expect } from 'vitest'
import {
  SUPPORTED_CHAINS,
  getChainById,
  getChainByName,
  isLayer3Network,
  arbitrumOne as arbitrumChain,
  bitlazerL3 as bitlazerChain,
} from '../chains'

describe('web3 chains helpers', () => {
  it('resolves networks by id and name', () => {
    const bit = getChainById(14235)!
    expect(bit.name).toBe('Bitlazer')
    expect(bit.nativeCurrency.symbol).toBe('lzrBTC')

    const arb = getChainByName('Arbitrum One')!
    expect(arb.id).toBe(42161)
    expect(arb.explorerUrl).toContain('arbiscan.io')
  })

  it('identifies layer-3 correctly', () => {
    expect(isLayer3Network(14235)).toBe(true)
    expect(isLayer3Network(42161)).toBe(false)
  })

  it('exports viem chains with matching ids', () => {
    expect(bitlazerChain.id).toBe(SUPPORTED_CHAINS.bitlazerL3.id)
    expect(arbitrumChain.id).toBe(SUPPORTED_CHAINS.arbitrumOne.id)
  })

  it('includes expected asset paths', () => {
    expect(SUPPORTED_CHAINS.bitlazerL3.icon).toMatch(/bitlazer-icon\.svg$/)
    expect(SUPPORTED_CHAINS.arbitrumOne.icon).toMatch(/arbitrum-color\.svg$/)
  })
})
