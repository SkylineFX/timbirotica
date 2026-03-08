import { eq, desc } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const db = useDrizzle()

  // Fetch addresses belonging to this authenticated user
  const userAddresses = await db.query.addresses.findMany({
    where: eq(tables.addresses.userId, session.user.id),
    orderBy: [
      desc(tables.addresses.isDefaultShipping), // prioritize default shipping
      desc(tables.addresses.createdAt)
    ]
  })

  return userAddresses
})
