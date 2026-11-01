import { describe, it, expect } from 'vitest'
import { mergeCartItems } from '~~/shared/utils/cart'

describe('mergeCartItems', () => {
  it('adds incoming quantities to a product already in the cart', () => {
    expect(mergeCartItems([{ productId: 1, quantity: 2 }], [{ productId: 1, quantity: 3 }]))
      .toEqual([{ productId: 1, quantity: 5, isNew: false }])
  })

  it('flags products not already in the cart as new', () => {
    expect(mergeCartItems([], [{ productId: 2, quantity: 1 }]))
      .toEqual([{ productId: 2, quantity: 1, isNew: true }])
  })

  it('consolidates duplicate incoming lines for the same product', () => {
    expect(mergeCartItems([], [{ productId: 1, quantity: 1 }, { productId: 1, quantity: 2 }]))
      .toEqual([{ productId: 1, quantity: 3, isNew: true }])
  })

  it('sums duplicate incoming lines on top of the existing quantity', () => {
    expect(mergeCartItems(
      [{ productId: 1, quantity: 5 }],
      [{ productId: 1, quantity: 1 }, { productId: 1, quantity: 2 }],
    )).toEqual([{ productId: 1, quantity: 8, isNew: false }])
  })

  it('returns nothing when there is nothing to merge', () => {
    expect(mergeCartItems([{ productId: 1, quantity: 1 }], [])).toEqual([])
  })

  it('handles a mix of existing and new products, preserving incoming order', () => {
    expect(mergeCartItems(
      [{ productId: 1, quantity: 2 }],
      [{ productId: 1, quantity: 1 }, { productId: 3, quantity: 4 }],
    )).toEqual([
      { productId: 1, quantity: 3, isNew: false },
      { productId: 3, quantity: 4, isNew: true },
    ])
  })

  it('leaves existing-only products untouched (not returned)', () => {
    expect(mergeCartItems(
      [{ productId: 1, quantity: 2 }, { productId: 9, quantity: 7 }],
      [{ productId: 1, quantity: 1 }],
    )).toEqual([{ productId: 1, quantity: 3, isNew: false }])
  })
})
