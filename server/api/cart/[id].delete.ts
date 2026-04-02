export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ status: 401, message: 'Unauthorized' })
  }

  const itemId = getRouterParam(event, 'id')
  const db = useDrizzle()

  const item = await db.query.cartItems.findFirst({
    where: eq(tables.cartItems.id, Number(itemId)),
    with: {
      cart: true
    }
  })

  if (!item || item.cart.userId !== session.user.id) {
    throw createError({ status: 404, message: 'Item not found' })
  }

  await db.delete(tables.cartItems)
    .where(eq(tables.cartItems.id, Number(itemId)))

  return { success: true }
})
