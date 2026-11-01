import { z } from 'zod'
import { sendContactMessage } from '../utils/email'

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(5000),
  turnstileToken: z.string().min(1, 'Verificare lipsa. Reincarca pagina si incearca din nou.'),
})

export default defineEventHandler(async (event) => {
  const result = contactSchema.safeParse(await readBody(event))

  if (!result.success) {
    // First validation issue becomes the user-facing message — keeps the
    // raw ZodError JSON out of the client toast.
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Datele formularului sunt invalide.' })
  }

  // Cloudflare Turnstile verification — rejects bots before sending an email.
  const turnstile = await verifyTurnstileToken(result.data.turnstileToken, event)
  if (!turnstile.success) {
    throw createError({ statusCode: 400, message: 'Verificare esuata. Reincarca pagina si incearca din nou.' })
  }

  const { turnstileToken: _turnstileToken, ...payload } = result.data

  try {
    await sendContactMessage(payload)
  } catch (err) {
    // Keep the visitor-facing message generic,
    // preserve the real cause so it reaches Sentry
    console.error('Failed to send contact message', err)
    throw createError({
      statusCode: 500,
      message: 'Mesajul nu a putut fi trimis. Incearca din nou mai tarziu.',
      cause: err
    })
  }

  return { success: true }
})
