import { createHash } from 'node:crypto'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const { token, password } = await readBody(event)

  if (!token || typeof token !== 'string' || !password || typeof password !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Date invalide.' })
  }

  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Parola trebuie sa aiba cel putin 8 caractere, o litera mare si o cifra.'
    })
  }

  const tokenHash = createHash('sha256').update(token).digest('hex')
  const db = useDrizzle()

  const resetToken = await db
    .select()
    .from(tables.passwordResetTokens)
    .where(eq(tables.passwordResetTokens.tokenHash, tokenHash))
    .get()

  if (!resetToken) {
    throw createError({ statusCode: 400, statusMessage: 'Link invalid sau expirat.' })
  }

  if (resetToken.expiresAt < Math.floor(Date.now() / 1000)) {
    await db
      .delete(tables.passwordResetTokens)
      .where(eq(tables.passwordResetTokens.id, resetToken.id))
    throw createError({
      statusCode: 400,
      statusMessage: 'Link-ul de resetare a expirat. Te rugam sa soliciti unul nou.'
    })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await db
    .update(tables.users)
    .set({ password: hashedPassword })
    .where(eq(tables.users.id, resetToken.userId))
  await db
    .delete(tables.passwordResetTokens)
    .where(eq(tables.passwordResetTokens.id, resetToken.id))

  // The new password changes the stamp, which signs out every session of this
  // account. When the person is signed in to the same account on this device,
  // as a Google-only account setting a password is, give that session the new
  // stamp so it stays signed in, with its expiry unchanged.
  if (hasSessionCookie(event)) {
    const session = await getUserSession(event)
    if (session.user?.id === resetToken.userId) {
      await saveUserSession(event, {
        secure: {
          passwordStamp: passwordStamp(hashedPassword),
          expiresAt: session.secure?.expiresAt ?? Date.now() + SESSION_MAX_AGE * 1000
        }
      })
    }
  }

  return { message: 'Parola a fost resetata cu succes.' }
})
