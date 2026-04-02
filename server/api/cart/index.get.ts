
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    // If not logged in, return empty or handle via client-side local storage logic
    // But this API is strictly for authenticated users.
    throw createError({
      status: 401,
      message: 'Unauthorized'
    })
  }

  const userId = session.user.id
  const db = useDrizzle()

  // Find or create cart
  let cart = await db.query.carts.findFirst({
    where: eq(tables.carts.userId, userId),
    with: {
      items: {
        with: {
          product: true
        }
      }
    }
  })

  // We don't necessarily need to create it on read if it's empty, 
  // but it simplifies things to return a standard structure.
  if (!cart) {
    return {
      id: null,
      items: []
    }
  }

  return cart
})
