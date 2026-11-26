import { and, eq } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import * as schema from '../db/schema'
import type { OrderStatus } from '~~/shared/constants/order'

type Db = LibSQLDatabase<typeof schema>

/**
 * Moves an order from one status to another in a single UPDATE that also
 * checks the old status, so a change made since the caller read the order (an
 * admin confirming it while the customer cancels) is never overwritten.
 * Returns the updated order, or undefined if the order no longer has status
 * `from`.
 */
export async function changeOrderStatus(db: Db, id: number, from: string, to: OrderStatus) {
  const [updated] = await db
    .update(schema.orders)
    .set({ status: to })
    .where(and(eq(schema.orders.id, id), eq(schema.orders.status, from)))
    .returning()
  return updated
}
