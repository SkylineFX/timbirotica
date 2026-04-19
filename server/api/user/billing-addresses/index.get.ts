import { eq, desc } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const db = useDrizzle()

  // Fetch billing addresses belonging to this authenticated user
  const userAddresses = await db.query.billingAddresses.findMany({
    where: eq(tables.billingAddresses.userId, session.user.id),
    orderBy: [
      desc(tables.billingAddresses.isDefaultBilling),
      desc(tables.billingAddresses.createdAt)
    ]
  })

  return userAddresses
})
