import { and, eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = parseInt(getRouterParam(event, 'id') ?? '')

  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: 'ID comanda invalid.' })
  }

  const db = useDrizzle()

  const order = await db.query.orders.findFirst({
    where: and(eq(tables.orders.id, id), eq(tables.orders.userId, session.user.id))
  })

  if (!order) {
    throw createError({ statusCode: 404, message: 'Comanda nu a fost gasita.' })
  }

  if (order.status !== 'processing') {
    throw createError({ statusCode: 400, message: 'Doar comenzile in procesare pot fi anulate.' })
  }

  const [updated] = await db.update(tables.orders)
    .set({ status: 'cancelled' })
    .where(eq(tables.orders.id, id))
    .returning()

  return updated
})
