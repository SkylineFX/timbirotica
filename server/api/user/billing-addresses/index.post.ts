import { eq } from 'drizzle-orm'
import { billingAddressSchema } from '~~/shared/schemas/billingAddress'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readValidatedBody(event, billingAddressSchema.parse)
  const db = useDrizzle()

  // Find existing addresses to check if we should auto-default
  const existingAddresses = await db.query.billingAddresses.findMany({
    where: eq(tables.billingAddresses.userId, session.user.id)
  })

  const isFirstAddress = existingAddresses.length === 0
  const shouldBeDefault = isFirstAddress || body.isDefaultBilling ? true : false

  if (shouldBeDefault && !isFirstAddress) {
    await db.update(tables.billingAddresses)
      .set({ isDefaultBilling: false })
      .where(eq(tables.billingAddresses.userId, session.user.id))
  }

  const nAddress = await db.insert(tables.billingAddresses).values({
    userId: session.user.id,
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
    createdAt: new Date()
  }).returning()

  return nAddress[0]
})
