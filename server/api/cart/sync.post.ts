import { mergeCartItems } from '~~/shared/utils/cart'
import { parseCartLines } from '~~/shared/schemas/cart'
import { buildProductLookups, buildCartMergeWrites } from '../../utils/cartMerge'

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
  // The lookup is split into queries that fit D1's parameter limit and sent as
  // one batch, so the size of the guest cart doesn't matter.
  const productIds = [...new Set(validLines.map((l) => l.productId))]
  const [firstLookup, ...moreLookups] = buildProductLookups(db, productIds)
  const found = firstLookup ? await db.batch([firstLookup, ...moreLookups]) : []
  const knownIds = new Set(found.flat().map((p) => p.id))
  const items = validLines.filter((l) => knownIds.has(l.productId))
  if (items.length === 0) return { success: true }

  // 1. Get or Create Cart
  const { id: cartId } = await getOrCreateCart(userId)

  // 2. Merge the guest cart into the user's cart: quantities for products already
  // present are summed, new products are added. The consolidation is a pure
  // function (mergeCartItems) so it can be unit tested without a database.
  const existingItems = await db.query.cartItems.findMany({
    where: eq(tables.cartItems.cartId, cartId),
    columns: { id: true, productId: true, quantity: true }
  })
  const merged = mergeCartItems(
    existingItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    items
  )

  // 3. Save the merge in one batch: one transaction, so a failure changes
  // nothing and the client keeps the guest cart to try again.
  const [firstWrite, ...moreWrites] = buildCartMergeWrites(db, {
    cartId,
    merged,
    existingItems
  })
  if (firstWrite) await db.batch([firstWrite, ...moreWrites])

  return { success: true }
})
