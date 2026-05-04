import { eq } from 'drizzle-orm'
import { z } from 'zod'

const bodySchema = z.object({
  status: z.enum(['processing', 'shipped', 'completed', 'cancelled'])
})

export default eventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') ?? '')
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: 'ID comandă invalid.' })
  }

  const { status } = await readValidatedBody(event, bodySchema.parse)

  const db = useDrizzle()
  const [updated] = await db.update(tables.orders)
    .set({ status })
    .where(eq(tables.orders.id, id))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Comanda nu a fost găsită.' })
  }

  return updated
})
