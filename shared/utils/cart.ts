// Pure cart-merge logic, extracted from the cart-sync endpoint so it can be unit
// tested without a database. The endpoint (server/api/cart/sync.post.ts) feeds it
// the user's existing cart rows and the guest cart, then persists the result.

export interface CartLine {
  productId: number
  quantity: number
}

export interface MergedCartLine extends CartLine {
  /** True when the product is not in the existing cart (caller inserts vs updates). */
  isNew: boolean
}

/**
 * Merge guest (incoming) cart lines into the user's existing cart lines.
 *
 * Final quantity per product = existing quantity + the sum of all incoming
 * quantities for that product (duplicate incoming lines are consolidated). Only
 * products present in `incoming` are returned — existing-only products are left
 * untouched, matching the endpoint's original behaviour.
 */
export function mergeCartItems(existing: CartLine[], incoming: CartLine[]): MergedCartLine[] {
  const existingQty = new Map<number, number>()
  for (const line of existing) {
    existingQty.set(line.productId, (existingQty.get(line.productId) ?? 0) + line.quantity)
  }

  const result: MergedCartLine[] = []
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
      isNew: !existingQty.has(line.productId),
    })
  }

  return result
}
