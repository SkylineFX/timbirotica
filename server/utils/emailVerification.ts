import { randomBytes, createHash } from 'node:crypto'
import type { H3Event } from 'h3'

export async function issueVerificationToken(event: H3Event, user: { id: number; email: string; firstName: string }) {
  const db = useDrizzle()

  await db.delete(tables.emailVerificationTokens).where(eq(tables.emailVerificationTokens.userId, user.id))

  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  const now = Math.floor(Date.now() / 1000)

  await db.insert(tables.emailVerificationTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt: now + 60 * 60 * 24,
    createdAt: now,
  })

  const origin = getRequestURL(event).origin
  const verifyLink = `${origin}/user/verify-email?token=${rawToken}`

  await sendEmailVerification({ email: user.email, firstName: user.firstName, verifyLink })
}
