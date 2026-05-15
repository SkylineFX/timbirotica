import { randomBytes, createHash } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const { email } = await readBody(event)

  // Always return the same message to prevent email enumeration
  const genericResponse = { message: 'Daca adresa de email exista in sistemul nostru, vei primi un link de resetare in cateva minute.' }

  if (!email || typeof email !== 'string') return genericResponse

  const db = useDrizzle()
  const user = await db.select().from(tables.users).where(eq(tables.users.email, email.toLowerCase().trim())).get()

  if (!user) return genericResponse

  // Delete any existing reset token for this user (one active token at a time)
  await db.delete(tables.passwordResetTokens).where(eq(tables.passwordResetTokens.userId, user.id))

  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  const now = Math.floor(Date.now() / 1000)

  await db.insert(tables.passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt: now + 3600,
    createdAt: now,
  })

  const origin = getRequestURL(event).origin
  const resetLink = `${origin}/user/reset-password?token=${rawToken}`

  try {
    await sendPasswordReset({ email: user.email, firstName: user.firstName, resetLink })
  } catch (e) {
    console.error('Failed to send password reset email', e)
  }

  return genericResponse
})
