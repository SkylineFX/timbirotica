import { z } from 'zod'
import { sendContactMessage } from '../utils/email'

// Messages match the contact form's own validation (app/pages/contact.vue).
const contactSchema = z.object({
  name: z.string('Numele este obligatoriu')
    .min(2, 'Numele trebuie sa aiba cel putin 2 caractere')
    .max(100, 'Numele poate avea cel mult 100 de caractere'),
  email: z.email('Adresa de email invalida'),
  subject: z.string('Subiectul este obligatoriu')
    .min(5, 'Subiectul trebuie sa aiba cel putin 5 caractere')
    .max(200, 'Subiectul poate avea cel mult 200 de caractere'),
  message: z.string('Mesajul este obligatoriu')
    .min(10, 'Mesajul trebuie sa aiba cel putin 10 caractere')
    .max(5000, 'Mesajul poate avea cel mult 5000 de caractere'),
  turnstileToken: z.string('Verificare lipsa. Reincarca pagina si incearca din nou.').min(1, 'Verificare lipsa. Reincarca pagina si incearca din nou.'),
}, { error: 'Datele formularului sunt invalide.' })

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
