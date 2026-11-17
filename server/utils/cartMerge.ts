import { eq, inArray } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import * as schema from '../db/schema'
import { CART_MAX_QUANTITY } from '~~/shared/schemas/cart'
import type { CartLine } from '~~/shared/utils/cart'
import { splitIntoChunks } from '~~/shared/utils/chunk'

// D1 allows at most 100 bound parameters per query. These sizes keep each
// statement below that, with room to spare.

/** Product ids per `IN (...)` lookup. Each id is one parameter. */
export const PRODUCT_IDS_PER_LOOKUP = 90

/** Cart lines per INSERT. Each line uses three parameters (cart, product, quantity). */
export const CART_ITEMS_PER_INSERT = 30

type Db = LibSQLDatabase<typeof schema>

/**
 * Queries that find which of the given product ids exist, split to fit D1's
 * parameter limit. Run them in one `db.batch(...)` and flatten the results.
 */
export function buildProductLookups(db: Db, productIds: readonly number[]) {
  return splitIntoChunks(productIds, PRODUCT_IDS_PER_LOOKUP).map(ids =>
    db.select({ id: schema.products.id })
      .from(schema.products)
      .where(inArray(schema.products.id, ids))
  )
}

/**
 * Writes that merge guest-cart lines into a cart, to run in one
 * `db.batch(...)`: an UPDATE for each product already in the cart and INSERTs
 * for new products, split to fit D1's parameter limit. A batch is one
 * transaction, so the cart is never left half-merged.
 *
 * `merged` comes from mergeCartItems. Quantities are capped at the maximum,
 * because adding guest and existing quantities can go over it.
 */
export function buildCartMergeWrites(
  db: Db,
  { cartId, merged, existingItemIdByProduct }: {
    cartId: number
    merged: readonly CartLine[]
    existingItemIdByProduct: ReadonlyMap<number, number>
  }
): BatchItem<'sqlite'>[] {
  const writes: BatchItem<'sqlite'>[] = []
  const newLines: (typeof schema.cartItems.$inferInsert)[] = []

  for (const line of merged) {
    const quantity = Math.min(line.quantity, CART_MAX_QUANTITY)
    const existingItemId = existingItemIdByProduct.get(line.productId)
    if (existingItemId === undefined) {
      newLines.push({ cartId, productId: line.productId, quantity })
    } else {
      writes.push(db.update(schema.cartItems).set({ quantity }).where(eq(schema.cartItems.id, existingItemId)))
    }
  }

  for (const chunk of splitIntoChunks(newLines, CART_ITEMS_PER_INSERT)) {
    writes.push(db.insert(schema.cartItems).values(chunk))
  }

  return writes
}
