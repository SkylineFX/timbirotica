import { eq } from 'drizzle-orm'
import { z } from 'zod'

const bodySchema = z.object({
  price: z.number().positive().optional(),
  stock: z.union([z.literal(0), z.literal(1)]).optional(),
}).refine(b => b.price !== undefined || b.stock !== undefined, {
  message: 'Trebuie să trimiți cel puțin un câmp.'
})

export default eventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') ?? '')
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: 'ID produs invalid.' })
  }

  const body = await readValidatedBody(event, bodySchema.parse)

  const db = useDrizzle()
  const [updated] = await db.update(tables.products)
    .set({
      ...(body.price !== undefined ? { price: body.price } : {}),
      ...(body.stock !== undefined ? { stock: body.stock } : {}),
    })
    .where(eq(tables.products.id, id))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Produsul nu a fost găsit.' })
  }

  return updated
})
