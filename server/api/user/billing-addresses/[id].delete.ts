import { eq, and } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = Number(getRouterParam(event, 'id'))
  const db = useDrizzle()

  if (!id) {
    throw createError({ statusCode: 400, message: 'Invalid address ID' })
  }

  // Ensure address belongs to user
  const address = await db.query.billingAddresses.findFirst({
    where: and(
      eq(tables.billingAddresses.id, id),
      eq(tables.billingAddresses.userId, session.user.id)
    )
  })

  if (!address) {
    throw createError({ statusCode: 404, message: 'Address not found' })
  }

  await db.delete(tables.billingAddresses)
    .where(and(
      eq(tables.billingAddresses.id, id),
      eq(tables.billingAddresses.userId, session.user.id)
    ))

  return { success: true }
})
