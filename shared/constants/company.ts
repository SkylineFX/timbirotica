// Company-wide constants shared by client and server.
// Keep these as single sources of truth so client-facing displays (checkout
// totals, etc.) can never drift from server-side calculations (proforma).

/**
 * VAT rate in percent (Romanian standard VAT).
 */
export const VAT_RATE = 21

/**
 * VAT portion contained in a VAT-inclusive (gross) price.
 *
 * Stored product prices are GROSS (the proforma divides them by `1 + VAT_RATE/100`
 * to derive the NET portion), so the VAT *within* a gross price is
 * `gross * VAT / (100 + VAT)` — NOT `gross * VAT / 100` (that would be the VAT
 * to ADD ON TOP of a net price).
 *
 * Example: a 121 RON gross price contains 21 RON of VAT.
 */
export const vatPortionOfGross = (gross: number): number =>
  (gross * VAT_RATE) / (100 + VAT_RATE)
