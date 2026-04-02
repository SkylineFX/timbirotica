import { eq, and } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const idParam = getRouterParam(event, 'id')
  if (!idParam) throw createError({ statusCode: 400, message: 'Missing address ID' })
    
  const id = parseInt(idParam, 10)
  const db = useDrizzle()

  // Verify the address belongs to the user
  const address = await db.query.addresses.findFirst({
    where: and(
      eq(tables.addresses.id, id),
      eq(tables.addresses.userId, session.user.id)
    )
  })

  if (!address) {
    throw createError({ statusCode: 404, message: 'Address not found' })
  }

  await db.delete(tables.addresses)
    .where(eq(tables.addresses.id, id))

  return { success: true }
})
