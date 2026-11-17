import { describe, it, expect } from 'vitest'
import {
  getCourierShippingCost,
  getShippingCost,
  computeOrderTotals,
  roundToBani,
  shippingMethodLabel,
  paymentMethodLabel,
  orderPayloadSchema,
  FREE_SHIPPING_THRESHOLD,
  COURIER_SHIPPING_COST,
} from '~~/shared/constants/order'

describe('getCourierShippingCost', () => {
  it('charges the flat courier cost below the free-shipping threshold', () => {
    expect(getCourierShippingCost(0)).toBe(COURIER_SHIPPING_COST)
    expect(getCourierShippingCost(FREE_SHIPPING_THRESHOLD - 1)).toBe(COURIER_SHIPPING_COST)
    expect(getCourierShippingCost(199.99)).toBe(COURIER_SHIPPING_COST)
  })

  it('is free at or above the threshold', () => {
    expect(getCourierShippingCost(FREE_SHIPPING_THRESHOLD)).toBe(0)
    expect(getCourierShippingCost(500)).toBe(0)
  })
})

describe('getShippingCost', () => {
  it('applies courier rules for the courier method', () => {
    expect(getShippingCost('courier', 50)).toBe(COURIER_SHIPPING_COST)
    expect(getShippingCost('courier', 250)).toBe(0)
  })

  it('is always free for pickup, regardless of subtotal', () => {
    expect(getShippingCost('pickup', 0)).toBe(0)
    expect(getShippingCost('pickup', 5000)).toBe(0)
  })
})

describe('method labels', () => {
  it('maps known shipping/payment methods to Romanian labels', () => {
    expect(shippingMethodLabel('courier')).toBe('Curier')
    expect(shippingMethodLabel('pickup')).toBe('Ridicare personala')
    expect(paymentMethodLabel('transfer')).toBe('Transfer bancar')
    expect(paymentMethodLabel('cash')).toBe('Ramburs')
  })

  it('falls back to the raw value for unknown methods', () => {
    expect(shippingMethodLabel('drone')).toBe('drone')
    expect(paymentMethodLabel('crypto')).toBe('crypto')
  })
})

describe('computeOrderTotals', () => {
  const items = [
    { quantity: 2, price: 50 }, // 100
    { quantity: 1, price: 30 }, // 30
  ]

  it('sums line items into the subtotal', () => {
    expect(computeOrderTotals(items, 'pickup').subtotal).toBe(130)
  })

  it('adds courier shipping below the free-shipping threshold', () => {
    const { subtotal, shippingCost, total } = computeOrderTotals(items, 'courier')
    expect(subtotal).toBe(130)
    expect(shippingCost).toBe(COURIER_SHIPPING_COST)
    expect(total).toBe(130 + COURIER_SHIPPING_COST)
  })

  it('gives free courier shipping at or above the threshold', () => {
    const big = [{ quantity: 1, price: FREE_SHIPPING_THRESHOLD }]
    const { shippingCost, total } = computeOrderTotals(big, 'courier')
    expect(shippingCost).toBe(0)
    expect(total).toBe(FREE_SHIPPING_THRESHOLD)
  })

  it('never charges shipping for pickup', () => {
    expect(computeOrderTotals(items, 'pickup').shippingCost).toBe(0)
  })

  it('returns zeroed totals for an empty cart', () => {
    expect(computeOrderTotals([], 'courier')).toEqual({ subtotal: 0, shippingCost: COURIER_SHIPPING_COST, total: COURIER_SHIPPING_COST })
  })

  it('rounds the totals to whole bani', () => {
    // 3 x 9.99 sums to 29.970000000000002 in floating point
    const { subtotal, total } = computeOrderTotals([{ quantity: 1, price: 9.99 }, { quantity: 1, price: 9.99 }, { quantity: 1, price: 9.99 }, { quantity: 1, price: 0.1 }, { quantity: 1, price: 0.2 }], 'pickup')
    expect(subtotal).toBe(30.27)
    expect(total).toBe(30.27)
  })

  it('gives free shipping to a cart of exactly 200 lei that floating point sums just below it', () => {
    // 0.01 + 129.14 + 70.85 is 199.99999999999997 in floating point
    const cart = [{ quantity: 1, price: 0.01 }, { quantity: 1, price: 129.14 }, { quantity: 1, price: 70.85 }]
    expect(computeOrderTotals(cart, 'courier')).toEqual({ subtotal: 200, shippingCost: 0, total: 200 })
  })
})

describe('roundToBani', () => {
  it('removes floating-point tails', () => {
    expect(roundToBani(9244.300000000003)).toBe(9244.3)
    expect(roundToBani(0.1 + 0.2)).toBe(0.3)
    expect(roundToBani(199.99999999999997)).toBe(200)
  })
})

describe('orderPayloadSchema', () => {
  const valid = {
    shippingMethod: 'courier',
    paymentMethod: 'transfer',
    billingSameAsShipping: true,
    termsAccepted: true,
  }

  it('accepts a minimal valid payload', () => {
    expect(orderPayloadSchema.safeParse(valid).success).toBe(true)
  })

  it('requires terms to be explicitly accepted (literal true)', () => {
    expect(orderPayloadSchema.safeParse({ ...valid, termsAccepted: false }).success).toBe(false)
  })

  it('rejects unknown shipping/payment methods', () => {
    expect(orderPayloadSchema.safeParse({ ...valid, shippingMethod: 'drone' }).success).toBe(false)
    expect(orderPayloadSchema.safeParse({ ...valid, paymentMethod: 'crypto' }).success).toBe(false)
  })
})
