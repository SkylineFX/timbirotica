import { eq } from 'drizzle-orm'
import { adminProductUpdateSchema } from '~~/shared/schemas/product'

export default eventHandler(async (event) => {
  await requireAdminSession(event)

  const id = parseInt(getRouterParam(event, 'id') ?? '')
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: 'ID produs invalid.' })
  }

  const body = await readBodyWithSchema(event, adminProductUpdateSchema)

  const db = useDrizzle()
  const [updated] = await db
    .update(tables.products)
    .set({
      ...(body.price !== undefined ? { price: body.price } : {}),
      ...(body.stock !== undefined ? { stock: body.stock } : {})
    })
    .where(eq(tables.products.id, id))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Produsul nu a fost gasit.' })
  }

  return updated
})
