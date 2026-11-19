// Emails the signed-in user a link to set a new password. This is how an
// account that signs in only with Google gets a password ("Seteaza o parola"
// on /user). The link goes to the account's own address, so it proves the
// person owns the mailbox. A stolen session can't use it to take the account.
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const db = useDrizzle()

  const user = await db.query.users.findFirst({
    where: eq(tables.users.id, session.user.id),
    columns: { id: true, email: true, firstName: true },
  })
  if (!user) {
    throw createError({ statusCode: 404, message: 'Utilizatorul nu a fost gasit.' })
  }

  const existing = await db.query.passwordResetTokens.findFirst({
    where: eq(tables.passwordResetTokens.userId, user.id),
    columns: { createdAt: true },
  })
  if (existing) {
    const wait = PASSWORD_EMAIL_INTERVAL - (Math.floor(Date.now() / 1000) - existing.createdAt)
    if (wait > 0) {
      throw createError({
        statusCode: 429,
        message: `Mai asteapta ${wait} secunde inainte de a cere un nou email.`,
        data: { retryAfter: wait },
      })
    }
  }

  try {
    await issuePasswordReset(event, user)
  } catch (e) {
    console.error('Failed to send password email', e)
    throw createError({
      statusCode: 500,
      message: 'Nu am putut trimite emailul. Incearca din nou in cateva minute.',
      cause: e,
    })
  }

  return { sent: true }
})
