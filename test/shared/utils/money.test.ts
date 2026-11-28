import { describe, it, expect } from 'vitest'
import { VAT_RATE } from '~~/shared/constants/company'
import {
  fromBani,
  isWholeBani,
  splitGross,
  sumLines,
  toBani,
  vatBreakdown
} from '~~/shared/utils/money'

describe('toBani and fromBani', () => {
  it('turns every whole-bani amount into lei and back unchanged', () => {
    for (let bani = 0; bani <= 10_000_000; bani++) {
      if (toBani(fromBani(bani)) !== bani) throw new Error(`${bani} bani changed`)
    }
  })

  it('rounds half a ban up, although lei * 100 lands just below it', () => {
    expect(toBani(1.005)).toBe(101) // 1.005 * 100 is 100.49999999999999
    expect(toBani(1.015)).toBe(102)
    expect(toBani(0.285)).toBe(29)
    expect(toBani(2.675)).toBe(268)
  })

  it('cleans floating-point tails', () => {
    expect(toBani(0.1 + 0.2)).toBe(30)
    expect(toBani(58.76000000000001)).toBe(5876)
    expect(fromBani(toBani(9244.300000000003))).toBe(9244.3)
  })
})

describe('isWholeBani', () => {
  it('accepts at most two decimals, tails included', () => {
    expect(isWholeBani(12.34)).toBe(true)
    expect(isWholeBani(0.1 + 0.2)).toBe(true)
    expect(isWholeBani(1000)).toBe(true)
  })

  it('refuses fractions of a ban', () => {
    expect(isWholeBani(12.345)).toBe(false)
    expect(isWholeBani(0.001)).toBe(false)
  })
})

describe('sumLines', () => {
  it('adds prices times quantities in bani', () => {
    expect(
      sumLines([
        { price: 19.99, quantity: 3 },
        { price: 0.1, quantity: 3 }
      ])
    ).toBe(6027)
    expect(sumLines([])).toBe(0)
  })
})

describe('splitGross', () => {
  it('uses the Romanian standard VAT rate', () => {
    expect(VAT_RATE).toBe(21)
  })

  it('splits a gross amount into net and the VAT it contains', () => {
    expect(splitGross(12100)).toEqual({ net: 10000, vat: 2100 })
    expect(splitGross(1000)).toEqual({ net: 826, vat: 174 })
    expect(splitGross(0)).toEqual({ net: 0, vat: 0 })
  })

  it('always adds back up to the gross', () => {
    for (let gross = 0; gross <= 200_000; gross++) {
      const { net, vat } = splitGross(gross)
      if (net + vat !== gross || !Number.isInteger(net))
        throw new Error(`${gross} bani split wrongly`)
    }
  })
})

describe('vatBreakdown', () => {
  it('adds up the rounded lines, so a printed document adds up to its totals (M11)', () => {
    // 30 lines of 1 x 10.00: the unrounded split gave totals 13 bani off the lines.
    const breakdown = vatBreakdown(Array.from({ length: 30 }, () => ({ price: 10, quantity: 1 })))
    expect(breakdown.rows.every((row) => row.net === 826 && row.vat === 174)).toBe(true)
    expect({ net: breakdown.net, vat: breakdown.vat }).toEqual({ net: 24780, vat: 5220 })
  })

  it('splits one line of many units as one amount', () => {
    const breakdown = vatBreakdown([{ price: 10, quantity: 30 }])
    expect({ net: breakdown.net, vat: breakdown.vat }).toEqual({ net: 24793, vat: 5207 })
  })

  it('includes the shipping cost as its own line', () => {
    const breakdown = vatBreakdown([{ price: 10, quantity: 1 }], 30)
    expect(breakdown.shipping).toEqual({ net: 2479, vat: 521 })
    expect({ net: breakdown.net, vat: breakdown.vat }).toEqual({ net: 826 + 2479, vat: 174 + 521 })
    expect(vatBreakdown([{ price: 10, quantity: 1 }]).shipping).toBeNull()
  })

  it('always gives net plus VAT equal to the gross total', () => {
    let seed = 7
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    for (let order = 0; order < 2000; order++) {
      const lines = Array.from({ length: 1 + Math.floor(random() * 40) }, () => ({
        price: fromBani(1 + Math.floor(random() * 50_000)),
        quantity: 1 + Math.floor(random() * 20)
      }))
      const shipping = random() < 0.5 ? 30 : 0
      const breakdown = vatBreakdown(lines, shipping)
      expect(breakdown.net + breakdown.vat).toBe(sumLines(lines) + toBani(shipping))
    }
  })
})
