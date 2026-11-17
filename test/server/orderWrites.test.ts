import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import { count, eq, sql } from 'drizzle-orm'
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from 'drizzle-kit/api'
import * as schema from '~~/server/db/schema'
import { buildOrderWrites, ORDER_ITEMS_PER_INSERT, type OrderLineWrite } from '~~/server/utils/orderWrites'

// Runs the real order writes against an in-memory SQLite database built from
// server/db/schema.ts, with foreign keys on as in D1. libsql allows far more
// bound parameters than D1, so the D1 limit is checked on the generated SQL.
const D1_MAX_BOUND_PARAMETERS = 100
const PRODUCT_COUNT = 60
const USER_ID = 1
const CART_ID = 1

type Db = LibSQLDatabase<typeof schema>
let db: Db
let createSchema: string[]

beforeAll(async () => {
  createSchema = await generateSQLiteMigration(
    await generateSQLiteDrizzleJson({}),
    await generateSQLiteDrizzleJson(schema),
  )
})

const order = (orderNumber = 'TEST0001') => ({
  userId: USER_ID,
  orderNumber,
  total: 1,
  createdAt: new Date(),
})

const linesFor = (n: number): OrderLineWrite[] =>
  Array.from({ length: n }, (_, i) => ({ productId: i + 1, quantity: 2, priceAtBuy: 9.99 }))

const rowCount = async (table: typeof schema.orders | typeof schema.orderItems | typeof schema.cartItems) =>
  (await db.select({ n: count() }).from(table))[0]!.n

beforeEach(async () => {
  db = drizzle(createClient({ url: ':memory:' }), { schema })
  await db.run(sql`PRAGMA foreign_keys = ON`)
  for (const statement of createSchema) await db.run(sql.raw(statement))

  const now = new Date()
  await db.insert(schema.users).values({ id: USER_ID, firstName: 'Test', email: 'test@example.com', password: 'x', createdAt: now })
  for (let i = 1; i <= PRODUCT_COUNT; i += 20) {
    await db.insert(schema.products).values(
      Array.from({ length: Math.min(20, PRODUCT_COUNT - i + 1) }, (_, k) => ({
        id: i + k, name: `Produs ${i + k}`, slug: `produs-${i + k}`, price: 9.99, createdAt: now,
      }))
    )
  }
  await db.insert(schema.carts).values({ id: CART_ID, userId: USER_ID, createdAt: now, updatedAt: now })
  for (let i = 1; i <= PRODUCT_COUNT; i += 20) {
    await db.insert(schema.cartItems).values(
      Array.from({ length: Math.min(20, PRODUCT_COUNT - i + 1) }, (_, k) => ({ cartId: CART_ID, productId: i + k, quantity: 2 }))
    )
  }
})

describe('buildOrderWrites', () => {
  it('keeps every statement within the D1 limit of bound parameters', () => {
    const writes = buildOrderWrites(db, { order: order(), lines: linesFor(PRODUCT_COUNT), cartId: CART_ID })
    // order row + one insert per chunk of lines + cart clearing
    expect(writes).toHaveLength(1 + Math.ceil(PRODUCT_COUNT / ORDER_ITEMS_PER_INSERT) + 1)
    for (const write of writes) {
      const { params } = (write as unknown as { toSQL(): { params: unknown[] } }).toSQL()
      expect(params.length).toBeLessThanOrEqual(D1_MAX_BOUND_PARAMETERS)
    }
  })

  it(`saves an order with ${PRODUCT_COUNT} different products and clears the cart`, async () => {
    await db.batch(buildOrderWrites(db, { order: order(), lines: linesFor(PRODUCT_COUNT), cartId: CART_ID }))

    const saved = await db.query.orders.findFirst({ where: eq(schema.orders.orderNumber, 'TEST0001'), with: { items: true } })
    expect(saved?.items).toHaveLength(PRODUCT_COUNT)
    expect(new Set(saved!.items.map(i => i.productId)).size).toBe(PRODUCT_COUNT)
    expect(saved!.items.every(i => i.orderId === saved!.id && i.quantity === 2 && i.priceAtBuy === 9.99)).toBe(true)
    expect(await rowCount(schema.cartItems)).toBe(0)
  })

  it('links the lines to the new order when other orders exist', async () => {
    await db.batch(buildOrderWrites(db, { order: order('FIRST001'), lines: linesFor(3), cartId: CART_ID }))
    await db.batch(buildOrderWrites(db, { order: order('SECOND01'), lines: linesFor(2), cartId: CART_ID }))

    const second = await db.query.orders.findFirst({ where: eq(schema.orders.orderNumber, 'SECOND01'), with: { items: true } })
    expect(second?.items).toHaveLength(2)
    expect(await rowCount(schema.orderItems)).toBe(5)
  })

  it('saves nothing when a line in a later chunk fails', async () => {
    const lines = linesFor(PRODUCT_COUNT)
    lines[PRODUCT_COUNT - 1] = { productId: 999_999, quantity: 1, priceAtBuy: 1 } // unknown product: foreign key fails

    await expect(db.batch(buildOrderWrites(db, { order: order(), lines, cartId: CART_ID }))).rejects.toThrow()

    expect(await rowCount(schema.orders)).toBe(0)
    expect(await rowCount(schema.orderItems)).toBe(0)
    expect(await rowCount(schema.cartItems)).toBe(PRODUCT_COUNT)
  })

  it('saves nothing when the order number already exists', async () => {
    await db.batch(buildOrderWrites(db, { order: order('SAME0001'), lines: linesFor(2), cartId: CART_ID }))
    await db.insert(schema.cartItems).values({ cartId: CART_ID, productId: 1, quantity: 1 })

    await expect(db.batch(buildOrderWrites(db, { order: order('SAME0001'), lines: linesFor(1), cartId: CART_ID }))).rejects.toThrow()

    expect(await rowCount(schema.orders)).toBe(1)
    expect(await rowCount(schema.orderItems)).toBe(2)
    expect(await rowCount(schema.cartItems)).toBe(1)
  })

  it('refuses to build an order without lines', () => {
    expect(() => buildOrderWrites(db, { order: order(), lines: [], cartId: CART_ID })).toThrow()
  })
})
