import { eq, inArray } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import * as schema from '../db/schema'
import { mergeCartItems, type CartLine } from '~~/shared/utils/cart'
import { splitIntoChunks } from '~~/shared/utils/chunk'
import { PRODUCT_IDS_PER_LOOKUP, buildCartMergeWrites } from './cartMerge'

// "Comanda din nou" puts the lines of a past order back into the cart in one
// request, whatever the size of the order: one product lookup batch and one
// write batch. A batch is one transaction, so the cart is never left half
// changed, and replacing the cart clears and refills it together.

type Db = LibSQLDatabase<typeof schema>

export interface ReorderResult {
  /** Products put in the cart. */
  added: number
  /** Names of products left out because they are unavailable or gone. */
  skipped: string[]
}

/**
 * Splits an order's lines into the products that can go back into the cart and
 * the names of those that can't (out of stock, or no longer in the catalog).
 * Repeated products are combined into one line.
 */
export function planReorder(
  lines: readonly CartLine[],
  products: readonly { id: number; name: string; stock: number }[]
): { available: CartLine[]; skipped: string[] } {
  const productById = new Map(products.map(p => [p.id, p]))
  const availableLines: CartLine[] = []
  const skipped = new Set<string>()
  for (const line of lines) {
    const product = productById.get(line.productId)
    if (product && product.stock > 0) availableLines.push(line)
    else skipped.add(product?.name ?? `Produsul #${line.productId}`)
  }
  const available = mergeCartItems([], availableLines).map(({ productId, quantity }) => ({ productId, quantity }))
  return { available, skipped: [...skipped] }
}

/**
 * Puts the order lines into the cart: added to what is already there, or, with
 * `replace`, instead of it. Quantities add up as with "Adauga in cos" and are
 * capped at the cart maximum. When no product is available, the cart is left
 * as it was, even with `replace`.
 */
export async function reorderIntoCart(
  db: Db,
  { cartId, lines, replace }: { cartId: number; lines: readonly CartLine[]; replace: boolean }
): Promise<ReorderResult> {
  const productIds = [...new Set(lines.map(l => l.productId))]
  const lookups = splitIntoChunks(productIds, PRODUCT_IDS_PER_LOOKUP).map(ids =>
    db.select({ id: schema.products.id, name: schema.products.name, stock: schema.products.stock })
      .from(schema.products)
      .where(inArray(schema.products.id, ids))
  )
  const [firstLookup, ...moreLookups] = lookups
  const products = firstLookup ? (await db.batch([firstLookup, ...moreLookups])).flat() : []

  const { available, skipped } = planReorder(lines, products)
  if (available.length === 0) return { added: 0, skipped }

  const existingItems = replace
    ? []
    : await db.select({ id: schema.cartItems.id, productId: schema.cartItems.productId, quantity: schema.cartItems.quantity })
        .from(schema.cartItems)
        .where(eq(schema.cartItems.cartId, cartId))

  const writes: BatchItem<'sqlite'>[] = []
  if (replace) writes.push(db.delete(schema.cartItems).where(eq(schema.cartItems.cartId, cartId)))
  writes.push(...buildCartMergeWrites(db, {
    cartId,
    merged: mergeCartItems(existingItems.map(i => ({ productId: i.productId, quantity: i.quantity })), available),
    existingItemIdByProduct: new Map(existingItems.map(i => [i.productId, i.id])),
  }))
  const [firstWrite, ...moreWrites] = writes
  await db.batch([firstWrite!, ...moreWrites])

  return { added: available.length, skipped }
}
