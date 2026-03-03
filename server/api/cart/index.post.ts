import { z } from 'zod'

const addToCartSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(1).default(1)
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ status: 401, message: 'Unauthorized' })
  }

  const { productId, quantity } = await readValidatedBody(event, addToCartSchema.parse)
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

  // 2. Check if item exists in cart
  const existingItem = await db.query.cartItems.findFirst({
    where: and(
      eq(tables.cartItems.cartId, cart.id),
      eq(tables.cartItems.productId, productId)
    )
  })

  if (existingItem) {
    // Update quantity
    await db.update(tables.cartItems)
      .set({ quantity: existingItem.quantity + quantity })
      .where(eq(tables.cartItems.id, existingItem.id))
  } else {
    // Insert new item
    await db.insert(tables.cartItems).values({
      cartId: cart.id,
      productId,
      quantity
    })
  }

  return { success: true }
})
