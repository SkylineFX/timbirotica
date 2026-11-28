import { describe, it, expect, beforeEach, vi } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import { CART_MAX_QUANTITY } from '~~/shared/schemas/cart'
import { planReorder, reorderIntoCart } from '~~/server/utils/cartReorder'
import {
  createTestDb,
  seedUserCartAndProducts,
  boundParameterCount,
  D1_MAX_BOUND_PARAMETERS,
  TEST_CART_ID,
  type TestDb
} from './testDb'

// Runs "Comanda din nou" (server/utils/cartReorder.ts) against an in-memory
// SQLite database built from server/db/schema.ts, with foreign keys on as in D1.
const PRODUCT_COUNT = 300

let db: TestDb

const cartLines = async () => {
  const rows = await db
    .select()
    .from(schema.cartItems)
    .where(eq(schema.cartItems.cartId, TEST_CART_ID))
  return Object.fromEntries(rows.map((r) => [r.productId, r.quantity]))
}

const putInCart = (lines: Record<number, number>) =>
  db.insert(schema.cartItems).values(
    Object.entries(lines).map(([productId, quantity]) => ({
      cartId: TEST_CART_ID,
      productId: Number(productId),
      quantity
    }))
  )

const outOfStock = (...ids: number[]) =>
  db.update(schema.products).set({ stock: 0 }).where(inArray(schema.products.id, ids))

beforeEach(async () => {
  db = await createTestDb()
  await seedUserCartAndProducts(db, PRODUCT_COUNT)
})

describe('planReorder', () => {
  const products = [
    { id: 1, name: 'Pix', stock: 1 },
    { id: 2, name: 'Caiet', stock: 0 },
    { id: 3, name: 'Riglă', stock: 1 }
  ]

  it('keeps available products and names the others', () => {
    const plan = planReorder(
      [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 },
        { productId: 9, quantity: 1 }
      ],
      products
    )
    expect(plan.available).toEqual([{ productId: 1, quantity: 2 }])
    expect(plan.skipped).toEqual(['Caiet', 'Produsul #9'])
  })

  it('combines repeated products into one line', () => {
    const plan = planReorder(
      [
        { productId: 3, quantity: 2 },
        { productId: 3, quantity: 5 },
        { productId: 2, quantity: 1 },
        { productId: 2, quantity: 1 }
      ],
      products
    )
    expect(plan.available).toEqual([{ productId: 3, quantity: 7 }])
    expect(plan.skipped).toEqual(['Caiet'])
  })
})

describe('reorderIntoCart', () => {
  it('adds the order to the cart, summing quantities like "Adauga in cos"', async () => {
    await putInCart({ 1: 2, 5: 1 })
    const result = await reorderIntoCart(db, {
      cartId: TEST_CART_ID,
      lines: [
        { productId: 1, quantity: 3 },
        { productId: 2, quantity: 1 }
      ],
      replace: false
    })
    expect(result).toEqual({ added: 2, skipped: [] })
    expect(await cartLines()).toEqual({ 1: 5, 2: 1, 5: 1 })
  })

  it('caps a line at the cart maximum', async () => {
    await putInCart({ 1: CART_MAX_QUANTITY - 10 })
    await reorderIntoCart(db, {
      cartId: TEST_CART_ID,
      lines: [{ productId: 1, quantity: 20 }],
      replace: false
    })
    expect(await cartLines()).toEqual({ 1: CART_MAX_QUANTITY })
  })

  it('replaces the cart with the order when asked', async () => {
    await putInCart({ 1: 2, 5: 1 })
    const result = await reorderIntoCart(db, {
      cartId: TEST_CART_ID,
      lines: [
        { productId: 2, quantity: 4 },
        { productId: 1, quantity: 1 }
      ],
      replace: true
    })
    expect(result).toEqual({ added: 2, skipped: [] })
    expect(await cartLines()).toEqual({ 1: 1, 2: 4 })
  })

  it('skips out-of-stock products and reports their names', async () => {
    await outOfStock(2, 3)
    const result = await reorderIntoCart(db, {
      cartId: TEST_CART_ID,
      lines: [1, 2, 3].map((productId) => ({ productId, quantity: 1 })),
      replace: false
    })
    expect(result).toEqual({ added: 1, skipped: ['Produs 2', 'Produs 3'] })
    expect(await cartLines()).toEqual({ 1: 1 })
  })

  it('leaves the cart as it was when nothing is available, even when replacing', async () => {
    await putInCart({ 7: 3 })
    await outOfStock(1, 2)
    const result = await reorderIntoCart(db, {
      cartId: TEST_CART_ID,
      lines: [
        { productId: 1, quantity: 1 },
        { productId: 2, quantity: 1 }
      ],
      replace: true
    })
    expect(result).toEqual({ added: 0, skipped: ['Produs 1', 'Produs 2'] })
    expect(await cartLines()).toEqual({ 7: 3 })
  })

  it(`handles a ${PRODUCT_COUNT}-line order in one write batch within D1's parameter limit`, async () => {
    await putInCart({ 1: 1, 2: 1 })
    const batch = vi.spyOn(db, 'batch')
    const lines = Array.from({ length: PRODUCT_COUNT }, (_, i) => ({
      productId: i + 1,
      quantity: 2
    }))
    for (const replace of [false, true]) {
      batch.mockClear()
      const result = await reorderIntoCart(db, { cartId: TEST_CART_ID, lines, replace })
      expect(result.added).toBe(PRODUCT_COUNT)
      // One batch for the product lookups and one for the writes.
      expect(batch).toHaveBeenCalledTimes(2)
      for (const [statements] of batch.mock.calls) {
        for (const statement of statements) {
          expect(boundParameterCount(statement)).toBeLessThanOrEqual(D1_MAX_BOUND_PARAMETERS)
        }
      }
    }
    const lastCart = await cartLines()
    expect(Object.keys(lastCart)).toHaveLength(PRODUCT_COUNT)
    expect(new Set(Object.values(lastCart))).toEqual(new Set([2]))
  })
})
