// A relative import, so the catalog scripts (run with tsx, without Nuxt's aliases) can use this file.
import { VAT_RATE } from '../constants/company'

// Money arithmetic in whole bani (1 RON = 100 bani). Prices are stored in lei
// with at most two decimals; adding or multiplying them as decimals leaves
// tails such as 0.30000000000000004, so every sum, split and comparison is
// done here in bani, which are integers and exact. Convert back with fromBani
// only to store or show an amount: a whole number of bani divided by 100 is
// stored and read back unchanged.

/**
 * Lei to whole bani. Also cleans a stored amount with a tail (58.76000000000001
 * -> 5876). lei * 100 can land a hair below a half ban (1.005 * 100 is
 * 100.49999999999999), so it is snapped to 6 decimals before rounding, and a
 * half ban rounds up (1.005 -> 101).
 */
export const toBani = (lei: number): number => Math.round(Number((lei * 100).toFixed(6)))

/** Whole bani back to lei, for storing and showing. */
export const fromBani = (bani: number): number => bani / 100

/** Whether an amount in lei is a whole number of bani (at most two decimals). */
export const isWholeBani = (lei: number): boolean => Math.abs(lei * 100 - toBani(lei)) < 1e-6

export interface GrossLine {
  /** Price per unit in lei, VAT included. */
  price: number
  quantity: number
}

/** The sum of the lines' prices times quantities, in bani. */
export const sumLines = (lines: readonly GrossLine[]): number =>
  lines.reduce((sum, line) => sum + toBani(line.price) * line.quantity, 0)

export interface NetAndVat {
  net: number
  vat: number
}

/**
 * A gross amount in bani (VAT included) split into net and VAT, in bani. The
 * two always add up to the gross. With VAT at 21% the division never ends in
 * exactly half a ban, so rounding is never ambiguous.
 */
export function splitGross(grossBani: number): NetAndVat {
  const net = Math.round((grossBani * 100) / (100 + VAT_RATE))
  return { net, vat: grossBani - net }
}

/**
 * Net and VAT per line, for the shipping cost, and in total, all in bani. Each
 * line is rounded on its own and the totals add up the rounded lines, so a
 * document that prints the lines (the proforma) adds up to its own totals, and
 * net plus VAT is exactly the gross total.
 */
export function vatBreakdown(lines: readonly GrossLine[], shippingCost = 0) {
  const rows = lines.map((line) => splitGross(toBani(line.price) * line.quantity))
  const shipping = shippingCost > 0 ? splitGross(toBani(shippingCost)) : null
  const all = shipping ? [...rows, shipping] : rows
  return {
    rows,
    shipping,
    net: all.reduce((sum, row) => sum + row.net, 0),
    vat: all.reduce((sum, row) => sum + row.vat, 0)
  }
}
