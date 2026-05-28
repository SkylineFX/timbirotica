import { desc, eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !session.user.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const userId = session.user.id

  const userOrders = await useDrizzle().query.orders.findMany({
    where: eq(tables.orders.userId, userId),
    orderBy: [desc(tables.orders.createdAt)],
    with: {
      items: {
        with: {
          product: {
            with: {
              category: { columns: { slug: true } }
            }
          }
        }
      },
      user: { columns: { firstName: true, lastName: true, phone: true } }
    }
  })

  return userOrders
})
