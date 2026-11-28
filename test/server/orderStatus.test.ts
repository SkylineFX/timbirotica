import { describe, it, expect, beforeEach } from 'vitest'
import { eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import { changeOrderStatus } from '~~/server/utils/orderStatus'
import { createTestDb, seedUserCartAndProducts, TEST_USER_ID, type TestDb } from './testDb'

// Runs the order status change (server/utils/orderStatus.ts) against an
// in-memory SQLite database built from server/db/schema.ts.
const ORDER_ID = 1

let db: TestDb

const storedStatus = async () =>
  (
    await db
      .select({ status: schema.orders.status })
      .from(schema.orders)
      .where(eq(schema.orders.id, ORDER_ID))
  )[0]?.status

beforeEach(async () => {
  db = await createTestDb()
  await seedUserCartAndProducts(db, 0)
  await db.insert(schema.orders).values({
    id: ORDER_ID,
    userId: TEST_USER_ID,
    orderNumber: 'TBR-TEST-1',
    total: 10,
    createdAt: new Date()
  })
})

describe('changeOrderStatus', () => {
  it('changes the status when the order still has the expected one', async () => {
    const updated = await changeOrderStatus(db, ORDER_ID, 'processing', 'cancelled')
    expect(updated?.status).toBe('cancelled')
    expect(await storedStatus()).toBe('cancelled')
  })

  it('leaves the order alone when its status changed after it was read', async () => {
    // The customer read the order as 'processing', then the admin confirmed it.
    await db
      .update(schema.orders)
      .set({ status: 'confirmed' })
      .where(eq(schema.orders.id, ORDER_ID))

    expect(await changeOrderStatus(db, ORDER_ID, 'processing', 'cancelled')).toBeUndefined()
    expect(await storedStatus()).toBe('confirmed')
  })

  it('returns nothing for an order that does not exist', async () => {
    expect(await changeOrderStatus(db, ORDER_ID + 1, 'processing', 'cancelled')).toBeUndefined()
  })
})
