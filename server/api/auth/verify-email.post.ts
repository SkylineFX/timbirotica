import { createHash } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const { token } = await readBody(event)

  if (!token || typeof token !== 'string') {
    throw createError({ statusCode: 400, message: 'Token invalid.' })
  }

  const tokenHash = createHash('sha256').update(token).digest('hex')
  const db = useDrizzle()

  const record = await db.query.emailVerificationTokens.findFirst({
    where: eq(tables.emailVerificationTokens.tokenHash, tokenHash)
  })

  if (!record) {
    throw createError({ statusCode: 400, message: 'Link de confirmare invalid sau deja folosit.' })
  }

  const now = Math.floor(Date.now() / 1000)
  if (record.expiresAt < now) {
    await db.delete(tables.emailVerificationTokens).where(eq(tables.emailVerificationTokens.id, record.id))
    throw createError({ statusCode: 400, message: 'Linkul de confirmare a expirat. Solicita unul nou.' })
  }

  await db.update(tables.users)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(tables.users.id, record.userId))

  await db.delete(tables.emailVerificationTokens).where(eq(tables.emailVerificationTokens.userId, record.userId))

  return { verified: true }
})
