import { describe, it, expect } from 'vitest'
import {
  getCourierShippingCost,
  getShippingCost,
  computeOrderTotals,
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
