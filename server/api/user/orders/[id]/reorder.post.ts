import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

const bodySchema = z
  .object(
    {
      // true: the order's products replace the cart; false: they are added to it.
      replace: z.boolean({ error: 'Date invalide.' }).default(false)
    },
    { error: 'Date invalide.' }
  )
  .default({ replace: false })

// "Comanda din nou": puts the products of one of the customer's orders back into
// their cart, in one request (server/utils/cartReorder.ts).
export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = parseInt(getRouterParam(event, 'id') ?? '')

  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: 'ID comanda invalid.' })
  }

  const { replace } = await readBodyWithSchema(event, bodySchema)
  const db = useDrizzle()

  const order = await db.query.orders.findFirst({
    where: and(eq(tables.orders.id, id), eq(tables.orders.userId, session.user.id)),
    columns: { id: true }
  })

  if (!order) {
    throw createError({ statusCode: 404, message: 'Comanda nu a fost gasita.' })
  }

  const lines = await db
    .select({ productId: tables.orderItems.productId, quantity: tables.orderItems.quantity })
    .from(tables.orderItems)
    .where(eq(tables.orderItems.orderId, id))

  if (lines.length === 0) return { added: 0, skipped: [] }

  const { id: cartId } = await getOrCreateCart(session.user.id)
  return reorderIntoCart(db, { cartId, lines, replace })
})
