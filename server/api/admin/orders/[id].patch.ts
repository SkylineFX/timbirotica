import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { ORDER_STATUS_LABEL, ORDER_STATUS_VALUES, canChangeOrderStatus } from '~~/shared/constants/order'

const bodySchema = z.object({
  status: z.enum(ORDER_STATUS_VALUES)
})

export default eventHandler(async (event) => {
  await requireAdminSession(event)

  const id = parseInt(getRouterParam(event, 'id') ?? '')
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: 'ID comanda invalid.' })
  }

  const { status } = await readValidatedBody(event, bodySchema.parse)

  const db = useDrizzle()
  const order = await db.query.orders.findFirst({
    where: eq(tables.orders.id, id),
    columns: { status: true }
  })

  if (!order) {
    throw createError({ statusCode: 404, message: 'Comanda nu a fost gasita.' })
  }

  if (!canChangeOrderStatus(order.status, status)) {
    const from = ORDER_STATUS_LABEL[order.status] ?? order.status
    throw createError({ statusCode: 400, message: `Statusul nu poate fi schimbat din ${from} in ${ORDER_STATUS_LABEL[status]}.` })
  }

  const updated = await changeOrderStatus(db, id, order.status, status)

  if (!updated) {
    throw createError({ statusCode: 409, message: 'Statusul comenzii s-a schimbat intre timp. Reincarca pagina.' })
  }

  return updated
})
