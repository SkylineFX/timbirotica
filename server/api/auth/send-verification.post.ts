import { issueVerificationToken } from '../../utils/emailVerification'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const db = useDrizzle()

  const user = await db.query.users.findFirst({
    where: eq(tables.users.id, session.user.id)
  })

  if (!user) {
    throw createError({ statusCode: 404, message: 'Utilizatorul nu a fost gasit.' })
  }

  if (user.emailVerifiedAt) {
    return { alreadyVerified: true }
  }

  const existing = await db.query.emailVerificationTokens.findFirst({
    where: eq(tables.emailVerificationTokens.userId, user.id)
  })

  if (existing) {
    const ageSec = Math.floor(Date.now() / 1000) - existing.createdAt
    if (ageSec < 60) {
      const wait = 60 - ageSec
      throw createError({
        statusCode: 429,
        message: `Mai asteapta ${wait} secunde inainte de a retrimite emailul.`,
        data: { retryAfter: wait }
      })
    }
  }

  try {
    await issueVerificationToken(event, { id: user.id, email: user.email, firstName: user.firstName })
  } catch (e: any) {
    console.error('Failed to send verification email', e)
    throw createError({ statusCode: 500, message: e?.message || 'Nu am putut trimite emailul de confirmare. Incearca din nou in cateva minute.' })
  }

  return { sent: true }
})
