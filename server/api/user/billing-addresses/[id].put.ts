import { eq, and } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
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

  const shouldBeDefault = body.isDefaultBilling ? true : false

  // If this address is being set as default, remove default from others
  if (shouldBeDefault && !address.isDefaultBilling) {
    await db.update(tables.billingAddresses)
      .set({ isDefaultBilling: false })
      .where(eq(tables.billingAddresses.userId, session.user.id))
  }

  const updated = await db.update(tables.billingAddresses)
    .set({
      companyName: body.companyName,
      cui: body.cui,
      hasRo: body.hasRo,
      onrc: body.onrc,
      bankName: body.bankName || null,
      iban: body.iban || null,
      street: body.street,
      city: body.city,
      county: body.county,
      isDefaultBilling: shouldBeDefault,
    })
    .where(and(
      eq(tables.billingAddresses.id, id),
      eq(tables.billingAddresses.userId, session.user.id)
    ))
    .returning()

  return updated[0]
})
