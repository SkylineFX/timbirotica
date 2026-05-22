import { z } from 'zod'
import { sendContactMessage } from '../utils/email'

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(5000)
})

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, body => contactSchema.safeParse(body))

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Datele formularului sunt invalide.' })
  }

  try {
    await sendContactMessage(result.data)
  } catch (err) {
    // Keep the visitor-facing message generic,
    // preserve the real cause so it reaches Sentry
    console.error('Failed to send contact message', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Mesajul nu a putut fi trimis. Incearca din nou mai tarziu.',
      cause: err
    })
  }

  return { success: true }
})
