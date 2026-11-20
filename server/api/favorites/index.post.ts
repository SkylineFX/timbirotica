
import { z } from 'zod'

const addToFavoritesSchema = z.object({
  productId: z.number()
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ status: 401, message: 'Unauthorized' })
  }

  const { productId } = await readValidatedBody(event, addToFavoritesSchema.parse)
  const userId = session.user.id
  const db = useDrizzle()

  // Check if already in favorites
  const existing = await db.query.favorites.findFirst({
    where: and(
      eq(tables.favorites.userId, userId),
      eq(tables.favorites.productId, productId)
    )
  })

  // Both answers include the row's id: the client shows the favorite at once
  // under a temporary id and needs the real one to remove it later.
  if (existing) {
    return { success: true, id: existing.id, message: 'Already in favorites' }
  }

  const created = await db.insert(tables.favorites).values({
    userId,
    productId,
    createdAt: new Date()
  }).returning({ id: tables.favorites.id }).get()

  return { success: true, id: created.id }
})
