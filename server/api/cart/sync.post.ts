import { z } from 'zod'
import { mergeCartItems } from '~~/shared/utils/cart'

const syncCartSchema = z.object({
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number()
  }))
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ status: 401, message: 'Unauthorized' })
  }

  const { items } = await readValidatedBody(event, syncCartSchema.parse)
  if (items.length === 0) return { success: true }

  const userId = session.user.id
  const db = useDrizzle()

  // 1. Get or Create Cart
  let cart = await db.query.carts.findFirst({
    where: eq(tables.carts.userId, userId)
  })

  if (!cart) {
    const [newCart] = await db.insert(tables.carts).values({
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning()
    cart = newCart
  }
  if (!cart) {
    throw createError({ status: 500, message: 'Nu am putut crea cosul.' })
  }
  const cartId = cart.id

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
    const existingItem = existingByProduct.get(line.productId)
    if (existingItem) {
      await db.update(tables.cartItems)
        .set({ quantity: line.quantity })
        .where(eq(tables.cartItems.id, existingItem.id))
    } else {
      await db.insert(tables.cartItems).values({
        cartId,
        productId: line.productId,
        quantity: line.quantity
      })
    }
  }

  return { success: true }
})
