import { randomBytes, createHash } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const { email, turnstileToken } = await readBody(event)

  // Cloudflare Turnstile verification — rejects bots before any DB work.
  // It's safe to error loudly here (unlike the email-existence check below):
  // the rejection reveals nothing about whether the email is registered.
  if (!turnstileToken || typeof turnstileToken !== 'string') {
    throw createError({ statusCode: 400, message: 'Verificare lipsa. Reincarca pagina si incearca din nou.' })
  }
  const turnstile = await verifyTurnstileToken(turnstileToken, event)
  if (!turnstile.success) {
    throw createError({ statusCode: 400, message: 'Verificare esuata. Reincarca pagina si incearca din nou.' })
  }

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
