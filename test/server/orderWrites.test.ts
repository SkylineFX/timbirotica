import { describe, it, expect, beforeEach } from 'vitest'
import { count, eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import {
  buildOrderWrites,
  ORDER_ITEMS_PER_INSERT,
  type OrderLineWrite
} from '~~/server/utils/orderWrites'
import {
  createTestDb,
  seedUserCartAndProducts,
  boundParameterCount,
  D1_MAX_BOUND_PARAMETERS,
  TEST_USER_ID,
  TEST_CART_ID,
  type TestDb
} from './testDb'

// Runs the real order writes against an in-memory SQLite database built from
// server/db/schema.ts, with foreign keys on as in D1.
const PRODUCT_COUNT = 60

let db: TestDb

const order = (orderNumber = 'TEST0001') => ({
  userId: TEST_USER_ID,
  orderNumber,
  total: 1,
  createdAt: new Date()
})

const linesFor = (n: number): OrderLineWrite[] =>
  Array.from({ length: n }, (_, i) => ({ productId: i + 1, quantity: 2, priceAtBuy: 9.99 }))

const rowCount = async (
  table: typeof schema.orders | typeof schema.orderItems | typeof schema.cartItems
) => (await db.select({ n: count() }).from(table))[0]!.n

beforeEach(async () => {
  db = await createTestDb()
  await seedUserCartAndProducts(db, PRODUCT_COUNT)
  await db.insert(schema.cartItems).values(
    Array.from({ length: PRODUCT_COUNT }, (_, i) => ({
      cartId: TEST_CART_ID,
      productId: i + 1,
      quantity: 2
    }))
  )
})

describe('buildOrderWrites', () => {
  it('keeps every statement within the D1 limit of bound parameters', () => {
    const writes = buildOrderWrites(db, {
      order: order(),
      lines: linesFor(PRODUCT_COUNT),
      cartId: TEST_CART_ID
    })
    // order row + one insert per chunk of lines + cart clearing
    expect(writes).toHaveLength(1 + Math.ceil(PRODUCT_COUNT / ORDER_ITEMS_PER_INSERT) + 1)
    for (const write of writes) {
      expect(boundParameterCount(write)).toBeLessThanOrEqual(D1_MAX_BOUND_PARAMETERS)
    }
  })

  it(`saves an order with ${PRODUCT_COUNT} different products and clears the cart`, async () => {
    await db.batch(
      buildOrderWrites(db, { order: order(), lines: linesFor(PRODUCT_COUNT), cartId: TEST_CART_ID })
    )

    const saved = await db.query.orders.findFirst({
      where: eq(schema.orders.orderNumber, 'TEST0001'),
      with: { items: true }
    })
    expect(saved?.items).toHaveLength(PRODUCT_COUNT)
    expect(new Set(saved!.items.map((i) => i.productId)).size).toBe(PRODUCT_COUNT)
    expect(
      saved!.items.every(
        (i) => i.orderId === saved!.id && i.quantity === 2 && i.priceAtBuy === 9.99
      )
    ).toBe(true)
    expect(await rowCount(schema.cartItems)).toBe(0)
  })

  it('links the lines to the new order when other orders exist', async () => {
    await db.batch(
      buildOrderWrites(db, { order: order('FIRST001'), lines: linesFor(3), cartId: TEST_CART_ID })
    )
    // the customer fills the cart again for a new order
    await db.insert(schema.cartItems).values([
      { cartId: TEST_CART_ID, productId: 1, quantity: 2 },
      { cartId: TEST_CART_ID, productId: 2, quantity: 2 }
    ])
    await db.batch(
      buildOrderWrites(db, { order: order('SECOND01'), lines: linesFor(2), cartId: TEST_CART_ID })
    )

    const second = await db.query.orders.findFirst({
      where: eq(schema.orders.orderNumber, 'SECOND01'),
      with: { items: true }
    })
    expect(second?.items).toHaveLength(2)
    expect(await rowCount(schema.orderItems)).toBe(5)
  })

  it('orders a cart once when it is submitted twice', async () => {
    // Both requests read the full cart before either saves, as with two tabs or a retry.
    const first = buildOrderWrites(db, {
      order: order('FIRST001'),
      lines: linesFor(PRODUCT_COUNT),
      cartId: TEST_CART_ID
    })
    const second = buildOrderWrites(db, {
      order: order('SECOND01'),
      lines: linesFor(PRODUCT_COUNT),
      cartId: TEST_CART_ID
    })

    const results = await Promise.allSettled([db.batch(first), db.batch(second)])

    expect(results.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected'])
    expect(await rowCount(schema.orders)).toBe(1)
    expect(await rowCount(schema.orderItems)).toBe(PRODUCT_COUNT)
    expect(await rowCount(schema.cartItems)).toBe(0)
  })

  it('saves nothing when the cart was emptied meanwhile', async () => {
    await db.delete(schema.cartItems)

    await expect(
      db.batch(buildOrderWrites(db, { order: order(), lines: linesFor(2), cartId: TEST_CART_ID }))
    ).rejects.toThrow()

    expect(await rowCount(schema.orders)).toBe(0)
    expect(await rowCount(schema.orderItems)).toBe(0)
  })

  it('saves nothing when a line in a later chunk fails', async () => {
    const lines = linesFor(PRODUCT_COUNT)
    lines[PRODUCT_COUNT - 1] = { productId: 999_999, quantity: 1, priceAtBuy: 1 } // unknown product: foreign key fails

    await expect(
      db.batch(buildOrderWrites(db, { order: order(), lines, cartId: TEST_CART_ID }))
    ).rejects.toThrow()

    expect(await rowCount(schema.orders)).toBe(0)
    expect(await rowCount(schema.orderItems)).toBe(0)
    expect(await rowCount(schema.cartItems)).toBe(PRODUCT_COUNT)
  })

  it('saves nothing when the order number already exists', async () => {
    await db.batch(
      buildOrderWrites(db, { order: order('SAME0001'), lines: linesFor(2), cartId: TEST_CART_ID })
    )
    await db.insert(schema.cartItems).values({ cartId: TEST_CART_ID, productId: 1, quantity: 1 })

    await expect(
      db.batch(
        buildOrderWrites(db, { order: order('SAME0001'), lines: linesFor(1), cartId: TEST_CART_ID })
      )
    ).rejects.toThrow()

    expect(await rowCount(schema.orders)).toBe(1)
    expect(await rowCount(schema.orderItems)).toBe(2)
    expect(await rowCount(schema.cartItems)).toBe(1)
  })

  it('refuses to build an order without lines', () => {
    expect(() =>
      buildOrderWrites(db, { order: order(), lines: [], cartId: TEST_CART_ID })
    ).toThrow()
  })
})
