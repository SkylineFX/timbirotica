import * as Sentry from '@sentry/nuxt'

export default defineEventHandler(async (event) => {
  const { email, turnstileToken } = await readBody(event)

  // Cloudflare Turnstile verification — rejects bots before any DB work.
  // It's safe to error loudly here (unlike the email-existence check below):
  // the rejection reveals nothing about whether the email is registered.
  if (!turnstileToken || typeof turnstileToken !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'Verificare lipsa. Reincarca pagina si incearca din nou.'
    })
  }
  const turnstile = await verifyTurnstileToken(turnstileToken, event)
  if (!turnstile.success) {
    throw createError({
      statusCode: 400,
      message: 'Verificare esuata. Reincarca pagina si incearca din nou.'
    })
  }

  // Always return the same message to prevent email enumeration
  const genericResponse = {
    message:
      'Daca adresa de email exista in sistemul nostru, vei primi un link de resetare in cateva minute.'
  }

  if (!email || typeof email !== 'string') return genericResponse

  const db = useDrizzle()
  const user = await db
    .select()
    .from(tables.users)
    .where(eq(tables.users.email, email.toLowerCase().trim()))
    .get()

  if (!user) return genericResponse

  // Answer at once and do the rest in the background. Waiting for the token
  // writes and the email would make a known address answer noticeably later
  // than an unknown one, which reveals that the account exists.
  event.waitUntil(
    issuePasswordReset(event, user).catch((e) => {
      // The visitor already got the generic answer, so they'd wait for an email
      // that never comes. Report it to Sentry so someone is alerted.
      console.error('Failed to send password reset email', e)
      Sentry.captureException(e, { tags: { area: 'password-reset-email', userId: user.id } })
    })
  )

  return genericResponse
})
