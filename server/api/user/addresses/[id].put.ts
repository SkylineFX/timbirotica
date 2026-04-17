import { eq, and } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const idParam = getRouterParam(event, 'id')
  if (!idParam) throw createError({ statusCode: 400, message: 'Missing address ID' })
  
  const id = parseInt(idParam, 10)
  const body = await readBody(event)
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

  const newIsDefaultShipping = body.isDefaultShipping !== undefined ? body.isDefaultShipping : address.isDefaultShipping

  if (newIsDefaultShipping && !address.isDefaultShipping) {
    await db.update(tables.addresses)
      .set({ isDefaultShipping: false })
      .where(eq(tables.addresses.userId, session.user.id))
  }

  // Update address
  const updatedAddress = await db.update(tables.addresses).set({
    firstName: body.firstName !== undefined ? body.firstName : address.firstName,
    lastName: body.lastName !== undefined ? body.lastName : address.lastName,
    phone: body.phone !== undefined ? body.phone : address.phone,
    street: body.street !== undefined ? body.street : address.street,
    city: body.city !== undefined ? body.city : address.city,
    county: body.county !== undefined ? body.county : address.county,
    postalCode: body.postalCode !== undefined ? body.postalCode : address.postalCode,
    isDefaultShipping: newIsDefaultShipping,
  }).where(
    eq(tables.addresses.id, id)
  ).returning()

  return updatedAddress[0]
})
