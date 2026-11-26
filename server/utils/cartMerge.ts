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
  return splitIntoChunks(productIds, PRODUCT_IDS_PER_LOOKUP).map((ids) =>
    db
      .select({ id: schema.products.id })
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
 * `merged` comes from mergeCartItems, which adds up every existing row of a
 * product. Quantities are capped at the maximum, because adding guest and
 * existing quantities can go over it.
 *
 * `existingItems` are the cart's rows. A product can have two rows (two quick
 * adds, until rank 22 adds a unique index). For a product being merged, the
 * first row takes the merged quantity, which counts every row, and the others
 * are deleted, so the extra row can't push the product past the maximum. A
 * product not being merged keeps its rows: nothing writes its total back.
 */
export function buildCartMergeWrites(
  db: Db,
  {
    cartId,
    merged,
    existingItems
  }: {
    cartId: number
    merged: readonly CartLine[]
    existingItems: readonly { id: number; productId: number }[]
  }
): BatchItem<'sqlite'>[] {
  const writes: BatchItem<'sqlite'>[] = []
  const newLines: (typeof schema.cartItems.$inferInsert)[] = []

  const mergedProductIds = new Set(merged.map((line) => line.productId))
  const existingItemIdByProduct = new Map<number, number>()
  const duplicateItemIds: number[] = []
  for (const item of existingItems) {
    if (!existingItemIdByProduct.has(item.productId))
      existingItemIdByProduct.set(item.productId, item.id)
    else if (mergedProductIds.has(item.productId)) duplicateItemIds.push(item.id)
  }
  for (const ids of splitIntoChunks(duplicateItemIds, PRODUCT_IDS_PER_LOOKUP)) {
    writes.push(db.delete(schema.cartItems).where(inArray(schema.cartItems.id, ids)))
  }

  for (const line of merged) {
    const quantity = Math.min(line.quantity, CART_MAX_QUANTITY)
    const existingItemId = existingItemIdByProduct.get(line.productId)
    if (existingItemId === undefined) {
      newLines.push({ cartId, productId: line.productId, quantity })
    } else {
      writes.push(
        db.update(schema.cartItems).set({ quantity }).where(eq(schema.cartItems.id, existingItemId))
      )
    }
  }

  for (const chunk of splitIntoChunks(newLines, CART_ITEMS_PER_INSERT)) {
    writes.push(db.insert(schema.cartItems).values(chunk))
  }

  return writes
}
