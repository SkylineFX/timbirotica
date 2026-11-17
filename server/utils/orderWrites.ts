import { eq, sql } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import * as schema from '../db/schema'

/**
 * Order lines per INSERT statement. D1 allows at most 100 bound parameters per
 * query, and each order line uses 4 (the order id lookup, product, quantity and
 * price). 20 lines use 80, which leaves room for a column added later.
 */
export const ORDER_ITEMS_PER_INSERT = 20

export interface OrderLineWrite {
  productId: number
  quantity: number
  priceAtBuy: number
}

/**
 * Build every write that places an order, to run in one `db.batch(...)` call:
 * the order row, its lines (split into statements that fit D1's parameter
 * limit, so an order can have any number of products) and clearing the cart.
 *
 * D1 and libsql run a batch as one transaction. Either everything is saved or
 * nothing is, so a failure can't leave an order without its lines.
 *
 * The lines find their order through its unique order number, because the new
 * order's id doesn't exist until the batch runs.
 */
export function buildOrderWrites(
  db: LibSQLDatabase<typeof schema>,
  { order, lines, cartId }: {
    order: typeof schema.orders.$inferInsert
    lines: OrderLineWrite[]
    cartId: number
  }
): [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]] {
  if (lines.length === 0) {
    throw new Error('An order needs at least one line.')
  }

  const orderId = sql<number>`(select ${schema.orders.id} from ${schema.orders} where ${schema.orders.orderNumber} = ${order.orderNumber})`

  const lineInserts: BatchItem<'sqlite'>[] = []
  for (let i = 0; i < lines.length; i += ORDER_ITEMS_PER_INSERT) {
    const chunk = lines.slice(i, i + ORDER_ITEMS_PER_INSERT)
    lineInserts.push(db.insert(schema.orderItems).values(chunk.map(line => ({ ...line, orderId }))))
  }

  return [
    db.insert(schema.orders).values(order),
    ...lineInserts,
    db.delete(schema.cartItems).where(eq(schema.cartItems.cartId, cartId)),
  ]
}
