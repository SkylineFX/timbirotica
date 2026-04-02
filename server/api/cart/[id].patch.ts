import { z } from 'zod'

const updateCartItemSchema = z.object({
  quantity: z.number().min(1)
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ status: 401, message: 'Unauthorized' })
  }

  const itemId = getRouterParam(event, 'id')
  const { quantity } = await readValidatedBody(event, updateCartItemSchema.parse)
  const db = useDrizzle()

  // Security: Check if the item belongs to the user's cart
  // (Simplified for now - strictly we should join with carts and check userId)
  const item = await db.query.cartItems.findFirst({
    where: eq(tables.cartItems.id, Number(itemId)),
    with: {
      cart: true
    }
  })

  if (!item || item.cart.userId !== session.user.id) {
    throw createError({ status: 404, message: 'Item not found' })
  }

  await db.update(tables.cartItems)
    .set({ quantity })
    .where(eq(tables.cartItems.id, Number(itemId)))

  return { success: true }
})
