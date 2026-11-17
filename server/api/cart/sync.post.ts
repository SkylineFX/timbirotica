import { mergeCartItems } from '~~/shared/utils/cart'
import { parseCartLines, CART_MAX_QUANTITY } from '~~/shared/schemas/cart'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ status: 401, message: 'Unauthorized' })
  }

  // The guest cart comes from localStorage, so treat every line as untrusted:
  // drop lines with an invalid productId/quantity rather than failing the sync.
  const body = await readBody(event)
  const validLines = parseCartLines(body?.items)
  if (validLines.length === 0) return { success: true }

  const userId = session.user.id
  const db = useDrizzle()

  // Drop products that no longer exist (deleted from the catalog since the guest
  // added them). Inserting them would fail the cart_items foreign key on D1.
  // parseCartLines keeps at most CART_SYNC_MAX_PRODUCTS ids, which keeps this
  // IN list within D1's limit of 100 bound parameters per query.
  const productIds = [...new Set(validLines.map(l => l.productId))]
  const existingProducts = await db.select({ id: tables.products.id })
    .from(tables.products)
    .where(inArray(tables.products.id, productIds))
  const knownIds = new Set(existingProducts.map(p => p.id))
  const items = validLines.filter(l => knownIds.has(l.productId))
  if (items.length === 0) return { success: true }

  // 1. Get or Create Cart
  const { id: cartId } = await getOrCreateCart(userId)

  // 2. Merge the guest cart into the user's cart: quantities for products already
  // present are summed, new products are inserted. The consolidation is a pure
  // function (mergeCartItems) so it can be unit tested without a database.
  const existingItems = await db.query.cartItems.findMany({
    where: eq(tables.cartItems.cartId, cartId)
  })
  const existingByProduct = new Map(existingItems.map(i => [i.productId, i]))

  const merged = mergeCartItems(
    existingItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
    items
  )

  for (const line of merged) {
    // Summing guest + existing quantities can exceed the per-line maximum.
    const quantity = Math.min(line.quantity, CART_MAX_QUANTITY)
    const existingItem = existingByProduct.get(line.productId)
    if (existingItem) {
      await db.update(tables.cartItems)
        .set({ quantity })
        .where(eq(tables.cartItems.id, existingItem.id))
    } else {
      await db.insert(tables.cartItems).values({
        cartId,
        productId: line.productId,
        quantity
      })
    }
  }

  return { success: true }
})
