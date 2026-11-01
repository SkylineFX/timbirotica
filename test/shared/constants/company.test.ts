import { describe, it, expect } from 'vitest'
import { VAT_RATE, vatPortionOfGross } from '~~/shared/constants/company'

describe('vatPortionOfGross', () => {
  it('uses the Romanian standard VAT rate', () => {
    expect(VAT_RATE).toBe(21)
  })

  it('extracts the VAT contained in a gross price (not added on top)', () => {
    // A 121 gross price contains exactly 21 of VAT (121 = 100 net + 21 VAT).
    expect(vatPortionOfGross(121)).toBeCloseTo(21, 10)
  })

  it('computes the VAT portion of an arbitrary gross amount', () => {
    // 100 * 21 / 121
    expect(vatPortionOfGross(100)).toBeCloseTo(17.355371900826448, 10)
  })

  it('returns 0 for a zero gross price', () => {
    expect(vatPortionOfGross(0)).toBe(0)
  })
})
