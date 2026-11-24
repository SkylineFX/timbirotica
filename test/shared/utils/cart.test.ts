import { describe, it, expect } from 'vitest'
import { mergeCartItems, nextCartQuantity } from '~~/shared/utils/cart'
import { CART_MAX_QUANTITY } from '~~/shared/schemas/cart'

describe('mergeCartItems', () => {
  it('adds incoming quantities to a product already in the cart', () => {
    expect(mergeCartItems([{ productId: 1, quantity: 2 }], [{ productId: 1, quantity: 3 }]))
      .toEqual([{ productId: 1, quantity: 5 }])
  })

  it('flags products not already in the cart as new', () => {
    expect(mergeCartItems([], [{ productId: 2, quantity: 1 }]))
      .toEqual([{ productId: 2, quantity: 1 }])
  })

  it('consolidates duplicate incoming lines for the same product', () => {
    expect(mergeCartItems([], [{ productId: 1, quantity: 1 }, { productId: 1, quantity: 2 }]))
      .toEqual([{ productId: 1, quantity: 3 }])
  })

  it('sums duplicate incoming lines on top of the existing quantity', () => {
    expect(mergeCartItems(
      [{ productId: 1, quantity: 5 }],
      [{ productId: 1, quantity: 1 }, { productId: 1, quantity: 2 }],
    )).toEqual([{ productId: 1, quantity: 8 }])
  })

  it('returns nothing when there is nothing to merge', () => {
    expect(mergeCartItems([{ productId: 1, quantity: 1 }], [])).toEqual([])
  })

  it('handles a mix of existing and new products, preserving incoming order', () => {
    expect(mergeCartItems(
      [{ productId: 1, quantity: 2 }],
      [{ productId: 1, quantity: 1 }, { productId: 3, quantity: 4 }],
    )).toEqual([
      { productId: 1, quantity: 3 },
      { productId: 3, quantity: 4 },
    ])
  })

  it('leaves existing-only products untouched (not returned)', () => {
    expect(mergeCartItems(
      [{ productId: 1, quantity: 2 }, { productId: 9, quantity: 7 }],
      [{ productId: 1, quantity: 1 }],
    )).toEqual([{ productId: 1, quantity: 3 }])
  })
})

describe('nextCartQuantity', () => {
  it('ignores an emptied field', () => {
    expect(nextCartQuantity(Number(undefined), 3)).toBeNull()
    expect(nextCartQuantity(Number(''), 3)).toBe(0) // Number('') is 0, which removes
    expect(nextCartQuantity(Infinity, 3)).toBeNull()
  })

  it('ignores the quantity the line already has', () => {
    expect(nextCartQuantity(3, 3)).toBeNull()
    expect(nextCartQuantity(CART_MAX_QUANTITY + 5, CART_MAX_QUANTITY)).toBeNull()
  })

  it('caps at the cart maximum and drops fractions', () => {
    expect(nextCartQuantity(999, 3)).toBe(CART_MAX_QUANTITY)
    expect(nextCartQuantity(4.7, 3)).toBe(4)
  })

  it('returns 0 to remove the line', () => {
    expect(nextCartQuantity(0, 3)).toBe(0)
    expect(nextCartQuantity(-2, 3)).toBe(0)
  })
})
