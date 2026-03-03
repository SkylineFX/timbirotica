import { z } from 'zod'

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

  // 2. Merge items
  // Strategy: For each item in guest cart, if exists in user cart, add quantities. If not, insert.
  for (const item of items) {
    const existingItem = await db.query.cartItems.findFirst({
      where: and(
        eq(tables.cartItems.cartId, cart.id),
        eq(tables.cartItems.productId, item.productId)
      )
    })

    if (existingItem) {
      await db.update(tables.cartItems)
        .set({ quantity: existingItem.quantity + item.quantity })
        .where(eq(tables.cartItems.id, existingItem.id))
    } else {
      await db.insert(tables.cartItems).values({
        cartId: cart.id,
        productId: item.productId,
        quantity: item.quantity
      })
    }
  }

  return { success: true }
})
