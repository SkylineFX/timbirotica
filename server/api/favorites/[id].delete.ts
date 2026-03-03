
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ status: 401, message: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  const db = useDrizzle()

  // We delete based on the favorite ID (pk) AND ensuring it belongs to the user
  await db.delete(tables.favorites)
    .where(and(
      eq(tables.favorites.id, Number(id)),
      eq(tables.favorites.userId, session.user.id)
    ))

  return { success: true }
})
