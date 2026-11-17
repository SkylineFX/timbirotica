import { z } from 'zod'

// Single rule for a cart line quantity, enforced by every cart endpoint and
// re-checked when an order is placed. The UI inputs cap at the same maximum.
// Far above real orders (the largest line so far is 20), low enough to catch
// typing mistakes such as an extra zero.
export const CART_MAX_QUANTITY = 250

// Most distinct products accepted from one guest-cart merge. This is only a
// safety bound against oversized requests, far above any real cart. The merge
// itself splits its queries to fit D1's limits (server/utils/cartMerge.ts).
export const CART_SYNC_MAX_PRODUCTS = 1000

export const cartQuantitySchema = z
  .number({ error: 'Cantitate invalida.' })
  .int('Cantitatea trebuie sa fie un numar intreg.')
  .min(1, 'Cantitatea minima este 1.')
  // Deliberately vague: don't tell customers the exact maximum.
  .max(CART_MAX_QUANTITY, 'Cantitate invalida.')

export const productIdSchema = z
  .number({ error: 'Produs invalid.' })
  .int('Produs invalid.')
  .positive('Produs invalid.')

export const cartLineSchema = z.object({
  productId: productIdSchema,
  quantity: cartQuantitySchema,
})

export type CartLineInput = z.infer<typeof cartLineSchema>

/**
 * Keep only the valid lines of a guest cart sent for merging. The guest cart
 * comes from localStorage, so:
 * - invalid lines are dropped one by one instead of rejecting the whole request,
 *   so one bad entry doesn't stop the rest of the guest cart from merging;
 * - a whole-number quantity above CART_MAX_QUANTITY is lowered to the maximum,
 *   the same cap the add-to-cart endpoint applies;
 * - at most CART_SYNC_MAX_PRODUCTS distinct products are kept. More lines for a
 *   product that is already kept are still accepted, and the merge sums them.
 */
export function parseCartLines(raw: unknown): CartLineInput[] {
  if (!Array.isArray(raw)) return []
  const lines: CartLineInput[] = []
  const productIds = new Set<number>()
  for (const entry of raw) {
    const result = cartLineSchema.safeParse(capQuantity(entry))
    if (!result.success) continue
    const { productId } = result.data
    if (!productIds.has(productId)) {
      if (productIds.size >= CART_SYNC_MAX_PRODUCTS) continue
      productIds.add(productId)
    }
    lines.push(result.data)
  }
  return lines
}

// Lower a whole-number quantity above the maximum to the maximum. Any other
// value passes through unchanged, for the schema to accept or reject.
function capQuantity(entry: unknown): unknown {
  if (typeof entry !== 'object' || entry === null) return entry
  const quantity = (entry as { quantity?: unknown }).quantity
  if (typeof quantity === 'number' && Number.isInteger(quantity) && quantity > CART_MAX_QUANTITY) {
    return { ...entry, quantity: CART_MAX_QUANTITY }
  }
  return entry
}
