import { describe, it, expect } from 'vitest'
import { adminProductUpdateSchema, productPriceSchema } from '~~/shared/schemas/product'

describe('productPriceSchema', () => {
  it('accepts prices in whole bani', () => {
    expect(productPriceSchema.safeParse(12.34).success).toBe(true)
    expect(productPriceSchema.safeParse(1000).success).toBe(true)
    expect(productPriceSchema.safeParse(0.1 + 0.2).success).toBe(true)
  })

  it('refuses fractions of a ban, zero and non-numbers, in Romanian', () => {
    expect(productPriceSchema.safeParse(12.345).error?.issues[0]?.message).toBe('Pretul poate avea cel mult doua zecimale.')
    expect(productPriceSchema.safeParse(0).error?.issues[0]?.message).toBe('Pretul trebuie sa fie mai mare decat 0.')
    expect(productPriceSchema.safeParse(NaN).success).toBe(false)
  })
})

describe('adminProductUpdateSchema', () => {
  it('needs a price, an availability or both', () => {
    expect(adminProductUpdateSchema.safeParse({ price: 9.99 }).success).toBe(true)
    expect(adminProductUpdateSchema.safeParse({ stock: 0 }).success).toBe(true)
    expect(adminProductUpdateSchema.safeParse({}).error?.issues[0]?.message).toBe('Trebuie sa trimiti cel putin un camp.')
    expect(adminProductUpdateSchema.safeParse({ price: 12.345 }).success).toBe(false)
  })
})
