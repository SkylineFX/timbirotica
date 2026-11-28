import { describe, it, expect } from 'vitest'
import {
  cartQuantitySchema,
  cartLineSchema,
  parseCartLines,
  CART_MAX_QUANTITY,
  CART_SYNC_MAX_PRODUCTS
} from '~~/shared/schemas/cart'

// The API returns the first validation issue as the error message shown to the
// customer, so the first issue must be the Romanian text for each bad input.
describe('first validation message', () => {
  const firstMessage = (
    schema: { safeParse: (v: unknown) => { error?: { issues: { message: string }[] } } },
    value: unknown
  ) => schema.safeParse(value).error?.issues[0]?.message

  it('names the quantity problem in Romanian', () => {
    expect(firstMessage(cartQuantitySchema, 'x')).toBe('Cantitate invalida.')
    expect(firstMessage(cartQuantitySchema, undefined)).toBe('Cantitate invalida.')
    expect(firstMessage(cartQuantitySchema, 1.5)).toBe('Cantitatea trebuie sa fie un numar intreg.')
    expect(firstMessage(cartQuantitySchema, -1)).toBe('Cantitatea minima este 1.')
    expect(firstMessage(cartQuantitySchema, CART_MAX_QUANTITY + 1)).toBe('Cantitate invalida.')
  })

  it('names an invalid product id in Romanian', () => {
    expect(firstMessage(cartLineSchema, { productId: 'x', quantity: 1 })).toBe('Produs invalid.')
    expect(firstMessage(cartLineSchema, { productId: 1.5, quantity: 1 })).toBe('Produs invalid.')
    expect(firstMessage(cartLineSchema, { productId: 0, quantity: 1 })).toBe('Produs invalid.')
  })
})

describe('cartQuantitySchema', () => {
  it('accepts positive integers up to the maximum', () => {
    expect(cartQuantitySchema.safeParse(1).success).toBe(true)
    expect(cartQuantitySchema.safeParse(CART_MAX_QUANTITY).success).toBe(true)
  })

  it('rejects zero and negative quantities', () => {
    expect(cartQuantitySchema.safeParse(0).success).toBe(false)
    expect(cartQuantitySchema.safeParse(-4).success).toBe(false)
  })

  it('rejects fractional quantities', () => {
    expect(cartQuantitySchema.safeParse(1.5).success).toBe(false)
  })

  it('rejects quantities above the maximum', () => {
    expect(cartQuantitySchema.safeParse(CART_MAX_QUANTITY + 1).success).toBe(false)
  })

  it('rejects non-numbers', () => {
    expect(cartQuantitySchema.safeParse('2').success).toBe(false)
    expect(cartQuantitySchema.safeParse(NaN).success).toBe(false)
    expect(cartQuantitySchema.safeParse(Infinity).success).toBe(false)
  })
})

describe('parseCartLines', () => {
  it('keeps valid lines', () => {
    expect(parseCartLines([{ productId: 1, quantity: 2 }])).toEqual([{ productId: 1, quantity: 2 }])
  })

  it('drops invalid lines but keeps the valid ones', () => {
    expect(
      parseCartLines([
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: -4 },
        { productId: 3, quantity: 1.5 },
        { productId: -1, quantity: 1 },
        { productId: 4 },
        null,
        'garbage',
        { productId: 5, quantity: 1 }
      ])
    ).toEqual([
      { productId: 1, quantity: 2 },
      { productId: 5, quantity: 1 }
    ])
  })

  it('strips extra fields sent with a line', () => {
    expect(parseCartLines([{ productId: 1, quantity: 1, product: { price: 0 } }])).toEqual([
      { productId: 1, quantity: 1 }
    ])
  })

  it('returns an empty list for a non-array body', () => {
    expect(parseCartLines(undefined)).toEqual([])
    expect(parseCartLines({ productId: 1, quantity: 1 })).toEqual([])
  })

  it('lowers a whole-number quantity above the maximum to the maximum', () => {
    expect(parseCartLines([{ productId: 1, quantity: CART_MAX_QUANTITY * 2 }])).toEqual([
      { productId: 1, quantity: CART_MAX_QUANTITY }
    ])
  })

  it('still drops large quantities that are not whole numbers', () => {
    expect(
      parseCartLines([
        { productId: 1, quantity: CART_MAX_QUANTITY + 0.5 },
        { productId: 2, quantity: Infinity }
      ])
    ).toEqual([])
  })

  it(`keeps at most ${CART_SYNC_MAX_PRODUCTS} distinct products`, () => {
    const raw = Array.from({ length: CART_SYNC_MAX_PRODUCTS + 20 }, (_, i) => ({
      productId: i + 1,
      quantity: 1
    }))
    const lines = parseCartLines(raw)
    expect(lines).toHaveLength(CART_SYNC_MAX_PRODUCTS)
    expect(lines.at(-1)).toEqual({ productId: CART_SYNC_MAX_PRODUCTS, quantity: 1 })
  })

  it('accepts more lines for a product that is already kept after the limit is reached', () => {
    const raw = [
      ...Array.from({ length: CART_SYNC_MAX_PRODUCTS }, (_, i) => ({
        productId: i + 1,
        quantity: 1
      })),
      { productId: 9999999, quantity: 1 },
      { productId: 1, quantity: 2 }
    ]
    const lines = parseCartLines(raw)
    expect(lines).toHaveLength(CART_SYNC_MAX_PRODUCTS + 1)
    expect(lines.at(-1)).toEqual({ productId: 1, quantity: 2 })
    expect(lines.some((l) => l.productId === 9999999)).toBe(false)
  })

  it('does not count invalid lines toward the product limit', () => {
    const raw = [
      ...Array.from({ length: CART_SYNC_MAX_PRODUCTS }, (_, i) => ({
        productId: i + 1,
        quantity: -1
      })),
      { productId: 500, quantity: 1 }
    ]
    expect(parseCartLines(raw)).toEqual([{ productId: 500, quantity: 1 }])
  })
})
