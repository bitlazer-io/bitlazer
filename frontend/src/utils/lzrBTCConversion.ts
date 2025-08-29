// Conversion utilities for lzrBTC
// 1 satoshi = 1000 lzrBTC
// 1 WBTC = 100,000,000 satoshis = 100,000,000,000 lzrBTC

import { formatUnits, parseUnits } from 'viem'

// Constants
export const SATOSHI_TO_LZRBTC_RATIO = 1000n // 1 satoshi = 1000 lzrBTC
export const WBTC_DECIMALS = 8
export const LZRBTC_DECIMALS = 18
export const SATOSHIS_PER_BTC = 100_000_000n // 1 BTC = 100,000,000 satoshis

// Conversion factor from WBTC (8 decimals) to lzrBTC (18 decimals)
// 1 WBTC unit (1 satoshi) = 1000 lzrBTC tokens = 1000 * 10^18 lzrBTC units = 10^21 lzrBTC units
export const WBTC_TO_LZRBTC_FACTOR = 10n ** 21n

/**
 * Convert WBTC amount to lzrBTC amount
 * @param wbtcAmount - Amount in WBTC units (8 decimals)
 * @returns Amount in lzrBTC units (18 decimals)
 */
export function wbtcToLzrBTC(wbtcAmount: bigint): bigint {
  return wbtcAmount * WBTC_TO_LZRBTC_FACTOR
}

/**
 * Convert lzrBTC amount to WBTC amount
 * @param lzrBTCAmount - Amount in lzrBTC units (18 decimals)
 * @returns Amount in WBTC units (8 decimals)
 */
export function lzrBTCToWbtc(lzrBTCAmount: bigint): bigint {
  return lzrBTCAmount / WBTC_TO_LZRBTC_FACTOR
}

/**
 * Convert satoshis to lzrBTC
 * @param satoshis - Amount in satoshis
 * @returns Amount in lzrBTC units (18 decimals)
 */
export function satoshisToLzrBTC(satoshis: bigint): bigint {
  // 1 satoshi = 1000 lzrBTC
  // Need to add 18 decimals for lzrBTC representation
  return satoshis * SATOSHI_TO_LZRBTC_RATIO * 10n ** BigInt(LZRBTC_DECIMALS)
}

/**
 * Convert lzrBTC to satoshis
 * @param lzrBTCAmount - Amount in lzrBTC units (18 decimals)
 * @returns Amount in satoshis
 */
export function lzrBTCToSatoshis(lzrBTCAmount: bigint): bigint {
  // Remove 18 decimals and divide by 1000
  return lzrBTCAmount / (SATOSHI_TO_LZRBTC_RATIO * 10n ** BigInt(LZRBTC_DECIMALS))
}

/**
 * Format lzrBTC amount for display (handles the 1 satoshi = 1000 lzrBTC conversion)
 * @param lzrBTCAmount - Raw amount in lzrBTC units (18 decimals)
 * @param displayDecimals - Number of decimal places to show
 * @returns Formatted string for display
 */
export function formatLzrBTCDisplay(lzrBTCAmount: bigint, displayDecimals = 2): string {
  // Convert to decimal string with 18 decimals
  const formatted = formatUnits(lzrBTCAmount, LZRBTC_DECIMALS)
  const num = parseFloat(formatted)

  if (num === 0) return '0'
  if (num < 0.01) return '<0.01'

  // Format with appropriate decimals
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals,
  })
}

/**
 * Format WBTC amount for display showing equivalent lzrBTC
 * @param wbtcAmount - Amount in WBTC units (8 decimals)
 * @returns Formatted string showing lzrBTC equivalent
 */
export function formatWBTCToLzrBTCDisplay(wbtcAmount: bigint): string {
  const lzrBTCAmount = wbtcToLzrBTC(wbtcAmount)
  return formatLzrBTCDisplay(lzrBTCAmount)
}

/**
 * Parse user input for lzrBTC amount
 * @param input - User input string
 * @returns Amount in lzrBTC units (18 decimals)
 */
export function parseLzrBTCInput(input: string): bigint {
  try {
    // Remove commas and trim
    const cleanInput = input.replace(/,/g, '').trim()
    if (!cleanInput || cleanInput === '0') return 0n

    // Parse as 18 decimal token
    return parseUnits(cleanInput, LZRBTC_DECIMALS)
  } catch {
    return 0n
  }
}

/**
 * Parse user input for WBTC and convert to lzrBTC
 * @param input - User input string in WBTC
 * @returns Amount in lzrBTC units (18 decimals)
 */
export function parseWBTCToLzrBTC(input: string): bigint {
  try {
    const cleanInput = input.replace(/,/g, '').trim()
    if (!cleanInput || cleanInput === '0') return 0n

    // Parse as WBTC (8 decimals) then convert to lzrBTC
    const wbtcAmount = parseUnits(cleanInput, WBTC_DECIMALS)
    return wbtcToLzrBTC(wbtcAmount)
  } catch {
    return 0n
  }
}

/**
 * Calculate the WBTC price per lzrBTC
 * @param wbtcPriceUSD - WBTC price in USD
 * @returns Price of 1 lzrBTC in USD
 */
export function calculateLzrBTCPrice(wbtcPriceUSD: number): number {
  // 1 WBTC = 100,000,000,000 lzrBTC
  // So 1 lzrBTC = wbtcPrice / 100,000,000,000
  return wbtcPriceUSD / 100_000_000_000
}

/**
 * Format satoshi amount to show lzrBTC equivalent
 * @param satoshis - Number of satoshis
 * @returns Formatted string
 */
export function formatSatoshiToLzrBTC(satoshis: number): string {
  const lzrBTCAmount = satoshis * 1000
  return lzrBTCAmount.toLocaleString('en-US')
}
