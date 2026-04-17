import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readBody(event)
  const db = useDrizzle()

  // Find existing addresses to check if we should auto-default
  const existingAddresses = await db.query.addresses.findMany({
    where: eq(tables.addresses.userId, session.user.id)
  })

  const isFirstAddress = existingAddresses.length === 0
  const shouldBeDefault = isFirstAddress || body.isDefaultShipping ? true : false

  if (shouldBeDefault && !isFirstAddress) {
    await db.update(tables.addresses)
      .set({ isDefaultShipping: false })
      .where(eq(tables.addresses.userId, session.user.id))
  }

  const nAddress = await db.insert(tables.addresses).values({
    userId: session.user.id,
    firstName: body.firstName,
    lastName: body.lastName,
    phone: body.phone,
    street: body.street,
    city: body.city,
    county: body.county,
    postalCode: body.postalCode || null,
    isDefaultShipping: shouldBeDefault,
    createdAt: new Date()
  }).returning()

  return nAddress[0]
})
