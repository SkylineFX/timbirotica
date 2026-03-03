
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({
      status: 401,
      message: 'Unauthorized'
    })
  }

  const userId = session.user.id
  const db = useDrizzle()

  const favorites = await db.query.favorites.findMany({
    where: eq(tables.favorites.userId, userId),
    with: {
      product: true
    },
    orderBy: (favorites, { desc }) => [desc(favorites.createdAt)]
  })

  return favorites
})
