import { CART_MAX_QUANTITY } from '~~/shared/schemas/cart'

// Pure cart-merge logic, extracted from the cart-sync endpoint so it can be unit
// tested without a database. The endpoint (server/api/cart/sync.post.ts) feeds it
// the user's existing cart rows and the guest cart, then persists the result.

export interface CartLine {
  productId: number
  quantity: number
}

/**
 * Merge guest (incoming) cart lines into the user's existing cart lines.
 *
 * Final quantity per product = existing quantity + the sum of all incoming
 * quantities for that product (duplicate incoming lines are consolidated). Only
 * products present in `incoming` are returned — existing-only products are left
 * untouched, matching the endpoint's original behaviour.
 */
export function mergeCartItems(existing: CartLine[], incoming: CartLine[]): CartLine[] {
  const existingQty = new Map<number, number>()
  for (const line of existing) {
    existingQty.set(line.productId, (existingQty.get(line.productId) ?? 0) + line.quantity)
  }

  const result: CartLine[] = []
  const indexByProduct = new Map<number, number>()

  for (const line of incoming) {
    const existingIndex = indexByProduct.get(line.productId)
    if (existingIndex !== undefined) {
      result[existingIndex]!.quantity += line.quantity
      continue
    }
    indexByProduct.set(line.productId, result.length)
    result.push({
      productId: line.productId,
      quantity: (existingQty.get(line.productId) ?? 0) + line.quantity,
    })
  }

  return result
}

/**
 * The quantity to apply when a cart line's quantity field reports `value`, or
 * null to do nothing. Nothing happens for an emptied field (Number(undefined)
 * is NaN) or for the quantity the line already has: the field reports its value
 * again on every blur. 0 or less means remove the line; anything else is a
 * whole number capped at the cart maximum.
 */
export function nextCartQuantity(value: number, current: number): number | null {
  if (!Number.isFinite(value)) return null
  const quantity = value <= 0 ? 0 : Math.min(Math.floor(value), CART_MAX_QUANTITY)
  return quantity === current ? null : quantity
}
