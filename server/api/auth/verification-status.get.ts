export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const db = useDrizzle()

  const user = await db.query.users.findFirst({
    where: eq(tables.users.id, session.user.id),
    columns: { emailVerifiedAt: true }
  })

  return { verified: !!user?.emailVerifiedAt }
})
