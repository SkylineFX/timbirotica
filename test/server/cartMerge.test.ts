import { describe, it, expect, beforeEach } from 'vitest'
import { eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import { mergeCartItems, type CartLine } from '~~/shared/utils/cart'
import { CART_MAX_QUANTITY } from '~~/shared/schemas/cart'
import {
  buildProductLookups, buildCartMergeWrites, PRODUCT_IDS_PER_LOOKUP, CART_ITEMS_PER_INSERT,
} from '~~/server/utils/cartMerge'
import {
  createTestDb, seedUserCartAndProducts, boundParameterCount,
  D1_MAX_BOUND_PARAMETERS, TEST_CART_ID, type TestDb,
} from './testDb'

// Runs the login cart merge queries against an in-memory SQLite database built
// from server/db/schema.ts, with foreign keys on as in D1.
const PRODUCT_COUNT = 300

let db: TestDb

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)

const cartLines = async () => {
  const rows = await db.select().from(schema.cartItems).where(eq(schema.cartItems.cartId, TEST_CART_ID))
  return new Map(rows.map(r => [r.productId, r.quantity]))
}

// The same steps as server/api/cart/sync.post.ts after the product lookup.
async function mergeIntoCart(incoming: CartLine[]) {
  const existing = await db.select().from(schema.cartItems).where(eq(schema.cartItems.cartId, TEST_CART_ID))
  const merged = mergeCartItems(existing.map(i => ({ productId: i.productId, quantity: i.quantity })), incoming)
  const writes = buildCartMergeWrites(db, {
    cartId: TEST_CART_ID,
    merged,
    existingItemIdByProduct: new Map(existing.map(i => [i.productId, i.id])),
  })
  const [first, ...rest] = writes
  if (first) await db.batch([first, ...rest])
  return writes
}

beforeEach(async () => {
  db = await createTestDb()
  await seedUserCartAndProducts(db, PRODUCT_COUNT)
  // The account's cart already holds products 1..5 (quantity 1) and product 6 near the maximum.
  await db.insert(schema.cartItems).values([
    ...range(1, 5).map(productId => ({ cartId: TEST_CART_ID, productId, quantity: 1 })),
    { cartId: TEST_CART_ID, productId: 6, quantity: CART_MAX_QUANTITY - 1 },
  ])
})

describe('buildProductLookups', () => {
  it('finds the existing products among many ids, within the D1 parameter limit', async () => {
    const ids = [...range(1, 240), ...range(990_001, 990_010)]
    const lookups = buildProductLookups(db, ids)

    expect(lookups).toHaveLength(Math.ceil(ids.length / PRODUCT_IDS_PER_LOOKUP))
    for (const lookup of lookups) {
      expect(boundParameterCount(lookup)).toBeLessThanOrEqual(D1_MAX_BOUND_PARAMETERS)
    }

    const [first, ...rest] = lookups
    const found = (await db.batch([first!, ...rest])).flat().map(p => p.id)
    expect(found.sort((a, b) => a - b)).toEqual(range(1, 240))
  })

  it('builds no query for no ids', () => {
    expect(buildProductLookups(db, [])).toEqual([])
  })
})

describe('buildCartMergeWrites', () => {
  it('merges a 200-product guest cart into an existing cart', async () => {
    const incoming = [
      ...range(1, 200).map(productId => ({ productId, quantity: 2 })),
      { productId: 6, quantity: 5 },   // pushes product 6 past the maximum
      { productId: 150, quantity: 3 }, // a second line for the same product
    ]

    const writes = await mergeIntoCart(incoming)

    // 6 updates for the products already in the cart, inserts in chunks for the other 194
    expect(writes).toHaveLength(6 + Math.ceil(194 / CART_ITEMS_PER_INSERT))
    for (const write of writes) {
      expect(boundParameterCount(write)).toBeLessThanOrEqual(D1_MAX_BOUND_PARAMETERS)
    }

    const lines = await cartLines()
    expect(lines.size).toBe(200)
    expect(lines.get(1)).toBe(3)                    // 1 already in the cart + 2
    expect(lines.get(6)).toBe(CART_MAX_QUANTITY)    // capped
    expect(lines.get(150)).toBe(5)                  // 2 + 3
    expect(lines.get(200)).toBe(2)
  })

  it('changes nothing when one line fails', async () => {
    const before = await cartLines()
    const incoming = [
      ...range(1, 100).map(productId => ({ productId, quantity: 2 })),
      { productId: 999_999, quantity: 1 }, // unknown product: foreign key fails in the last insert
    ]

    await expect(mergeIntoCart(incoming)).rejects.toThrow()

    expect(await cartLines()).toEqual(before)
  })

  it('builds no writes when there is nothing to merge', async () => {
    expect(await mergeIntoCart([])).toEqual([])
  })
})
