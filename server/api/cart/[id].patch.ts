import { z } from 'zod'
import { cartQuantitySchema } from '~~/shared/schemas/cart'

const updateCartItemSchema = z.object(
  {
    quantity: cartQuantitySchema
  },
  { error: 'Date invalide.' }
)

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ status: 401, message: 'Unauthorized' })
  }

  const itemId = getRouterParam(event, 'id')
  const { quantity } = await readBodyWithSchema(event, updateCartItemSchema)
  const db = useDrizzle()

  // Only the owner of the cart may change its lines.
  const item = await db.query.cartItems.findFirst({
    where: eq(tables.cartItems.id, Number(itemId)),
    with: {
      cart: true
    }
  })

  if (!item || item.cart.userId !== session.user.id) {
    throw createError({ status: 404, message: 'Item not found' })
  }

  await db
    .update(tables.cartItems)
    .set({ quantity })
    .where(eq(tables.cartItems.id, Number(itemId)))

  return { success: true }
})
