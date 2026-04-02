
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

  if (existing) {
    return { success: true, message: 'Already in favorites' }
  }

  await db.insert(tables.favorites).values({
    userId,
    productId,
    createdAt: new Date()
  })

  return { success: true }
})
