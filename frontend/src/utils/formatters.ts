// Formatting utilities inspired by t3rn-bridge-ui

export const USDollarFormatOptions: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
}

export const USDollar = new Intl.NumberFormat('en-US', USDollarFormatOptions)

export const USDollarCompact = new Intl.NumberFormat('en-US', {
  ...USDollarFormatOptions,
  notation: 'compact',
  maximumFractionDigits: 2,
})

export function isNumber(value: unknown): value is number {
  return typeof value === 'number'
}

export function formatPreciseNumber(input: number | bigint | string, useCommas = false): string {
  // Convert input to number
  const value = typeof input === 'bigint' ? Number(input) : typeof input === 'string' ? parseFloat(input) : input

  if (isNaN(value) || value === 0) return '0'

  const absValue = Math.abs(value)
  const isNegative = value < 0

  let result: string

  if (absValue >= 10) {
    // For numbers >= 10, show only 2 decimals
    result = absValue.toFixed(2)
  } else {
    // For numbers < 10, show 4 significant digits
    result = absValue.toPrecision(4)

    // Convert scientific notation to decimal if possible
    if (result.includes('e')) {
      const num = parseFloat(result)
      if (num >= 0.0001) {
        // Convert to fixed decimal notation for readability
        result = num.toFixed(20) // Use high precision first
        // Then trim to appropriate length
        const match = result.match(/^(\d+\.?\d*?)0*$/)
        if (match) {
          result = match[1]
        }
      } else {
        // For very small numbers, show <0.0001 for better UX
        result = '<0.0001'
      }
    }
  }

  // Remove trailing zeros after decimal point
  if (result.includes('.')) {
    result = result.replace(/\.?0+$/, '')
  }

  // Add thousand separators for numbers >= 1000 if enabled
  if (useCommas) {
    const finalNumber = parseFloat(result)
    if (Math.abs(finalNumber) >= 1000) {
      const parts = result.split('.')
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      result = parts.join('.')
    }
  }

  return isNegative ? `-${result}` : result
}

export function formatMoney(value: Parameters<typeof formatPreciseNumber>[0]): string {
  return `$${formatPreciseNumber(value, true)}`
}

export function formatCompactNumber(value: number, forceTruncate = false): string {
  // Force truncation for very large numbers or when explicitly requested
  if (forceTruncate || value >= 1e12) {
    if (value >= 1e15) return `${(value / 1e15).toFixed(1)}Q`
    if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
  }

  // Standard formatting
  if (value >= 1e15) return `${(value / 1e15).toFixed(2)}Q`
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`
  return formatPreciseNumber(value)
}

export function formatTokenAmount(amount: number): string {
  if (amount === 0) return '0'
  if (amount < 0.0001) return '<0.0001'
  if (amount < 1) return amount.toFixed(6)
  if (amount < 1000) return amount.toFixed(4)
  return formatCompactNumber(amount)
}

export function formatPercentage(value: number): string {
  if (value > 1e6) return `${(value / 1e6).toFixed(1)}M%`
  if (value > 1e3) return `${(value / 1e3).toFixed(1)}K%`
  if (value > 100) return `${value.toFixed(0)}%`
  return `${value.toFixed(2)}%`
}

export function formatCryptoAddress(address: string): string {
  return `${address?.slice(0, 6)}...${address?.slice(-4)}`
}

export function formatTxHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}
