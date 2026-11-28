/**
 * Return the user's cart, creating it on first use.
 *
 * carts.user_id is unique, so two first requests at the same time (a double
 * click on "Adauga in cos", or a sync racing an add) would make the second
 * plain INSERT fail. ON CONFLICT DO NOTHING lets both requests succeed, and
 * the re-read returns the one cart that exists.
 */
export async function getOrCreateCart(userId: number) {
  const db = useDrizzle()

  const existing = await db.query.carts.findFirst({
    where: eq(tables.carts.userId, userId)
  })
  if (existing) return existing

  const now = new Date()
  await db
    .insert(tables.carts)
    .values({ userId, createdAt: now, updatedAt: now })
    .onConflictDoNothing({ target: tables.carts.userId })

  const cart = await db.query.carts.findFirst({
    where: eq(tables.carts.userId, userId)
  })
  if (!cart) {
    throw createError({ statusCode: 500, message: 'Nu am putut crea cosul.' })
  }
  return cart
}
