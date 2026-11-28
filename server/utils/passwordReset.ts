import { randomBytes, createHash } from 'node:crypto'
import type { H3Event } from 'h3'

/** Minimum time between two password emails for the same account, in seconds. */
export const PASSWORD_EMAIL_INTERVAL = 60

/**
 * Replace the account's reset token with a new one (valid for 1 hour) and
 * email the link. Used by "Am uitat parola" and by "Seteaza o parola" for
 * accounts that sign in only with Google.
 */
export async function issuePasswordReset(
  event: H3Event,
  user: { id: number; email: string; firstName: string }
) {
  const db = useDrizzle()
  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  const now = Math.floor(Date.now() / 1000)

  // One active token per account: the old one is deleted in the same batch.
  await db.batch([
    db.delete(tables.passwordResetTokens).where(eq(tables.passwordResetTokens.userId, user.id)),
    db
      .insert(tables.passwordResetTokens)
      .values({ userId: user.id, tokenHash, expiresAt: now + 3600, createdAt: now })
  ])

  const resetLink = `${siteOrigin(event)}/user/reset-password?token=${rawToken}`
  await sendPasswordReset({ email: user.email, firstName: user.firstName, resetLink })
}
