export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ status: 401, message: 'Unauthorized' })
  }

  const db = useDrizzle()

  const cart = await db.query.carts.findFirst({
    where: eq(tables.carts.userId, session.user.id)
  })

  if (!cart) return { success: true }

  await db.delete(tables.cartItems).where(eq(tables.cartItems.cartId, cart.id))

  return { success: true }
})
