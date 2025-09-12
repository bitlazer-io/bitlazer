import { describe, it, expect } from 'vitest'
import {
  formatPreciseNumber,
  formatMoney,
  formatCompactNumber,
  formatTokenAmount,
  formatPercentage,
  formatCryptoAddress,
  formatTxHash,
  formatAddress,
  calculatePercentageAmount,
} from '../../utils/formatters'

describe('formatters', () => {
  it('formats precise numbers with rules', () => {
    expect(formatPreciseNumber(123.456)).toBe('123.46')
    expect(formatPreciseNumber(9.87654)).toBe('9.877')
    expect(formatPreciseNumber('1e-7')).toBe('<0.0001')
    expect(formatPreciseNumber(12345.678, true)).toBe('12,345.68')
    expect(formatPreciseNumber(-1000.1, true)).toBe('-1,000.1')
  })

  it('formats money with thousand separators', () => {
    expect(formatMoney(12345.678)).toBe('$12,345.68')
  })

  it('formats compact numbers', () => {
    expect(formatCompactNumber(12_345)).toBe('12.35K')
    expect(formatCompactNumber(1_234_567)).toBe('1.23M')
    expect(formatCompactNumber(1_234_567_890)).toBe('1.23B')
  })

  it('formats token amounts by thresholds', () => {
    expect(formatTokenAmount(0)).toBe('0')
    expect(formatTokenAmount(0, 'LZRBTC')).toBe('0 LZRBTC')
    expect(formatTokenAmount(0.00001)).toBe('<0.0001')
    expect(formatTokenAmount(0.1234567)).toBe('0.123457')
    expect(formatTokenAmount(12.345678)).toBe('12.3457')
    expect(formatTokenAmount(12_345)).toBe('12.35K')
  })

  it('formats percentages', () => {
    expect(formatPercentage(0.1234)).toBe('0.12%')
    expect(formatPercentage(150)).toBe('150%')
    expect(formatPercentage(1_234)).toBe('1.2K%')
  })

  it('shortens addresses and hashes', () => {
    const addr = '0x1234567890abcdef1234567890abcdef12345678'
    expect(formatCryptoAddress(addr)).toBe('0x1234...5678')
    expect(formatTxHash(addr)).toBe('0x1234...5678')
    expect(formatAddress('0x0000000000000000000000000000000000000000')).toBe('0x0000...0000')
    expect(formatAddress(addr)).toBe('0x1234...5678')
  })

  it('calculates percentage amounts with decimals', () => {
    expect(calculatePercentageAmount('100', 50, 2)).toBe('50')
    expect(calculatePercentageAmount('1', 100, 18)).toBe('1')
    expect(calculatePercentageAmount('1', 100, 8)).toBe('0.99999999')
  })
})
