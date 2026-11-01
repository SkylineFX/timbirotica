import { z } from 'zod'
import bcrypt from 'bcryptjs'

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  remember: z.boolean().optional(),
  turnstileToken: z.string().min(1, 'Verificare lipsa. Reincarca pagina si incearca din nou.'),
})

// Pre-computed bcrypt hash used to equalize response time when the email
// isn't found, preventing user enumeration via timing of login attempts.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10)

export default defineEventHandler(async (event) => {
  const result = bodySchema.safeParse(await readBody(event))
  if (!result.success) {
    // First validation issue becomes the user-facing message — avoids leaking
    // the raw ZodError JSON to the client (which h3's readValidatedBody does).
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Date invalide.' })
  }
  const { email, password, remember, turnstileToken } = result.data

  // Cloudflare Turnstile verification — rejects bots/credential-stuffing before DB or bcrypt work.
  const turnstile = await verifyTurnstileToken(turnstileToken, event)
  if (!turnstile.success) {
    throw createError({ statusCode: 400, message: 'Verificare esuata. Reincarca pagina si incearca din nou.' })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const config = useRuntimeConfig()

  if (!config.session.password) {
    throw createError({
      status: 500,
      message: 'Missing NUXT_SESSION_PASSWORD environment variable',
    })
  }

  const db = useDrizzle()
  const user = await db.query.users.findFirst({
    where: eq(tables.users.email, normalizedEmail)
  })

  if (!user) {
    // Equalize timing with the found-user path so attackers can't enumerate emails.
    await bcrypt.compare(password, DUMMY_HASH)
    throw createError({
      status: 401,
      message: 'Adresa de email sau parola incorecta.',
    })
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    throw createError({
      status: 401,
      message: 'Adresa de email sau parola incorecta.',
    })
  }

  // set the user session in the cookie
  await setUserSession(event, {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as 'user' | 'admin',
    },
  }, {
    maxAge: remember ? 60 * 60 * 24 * 30 : undefined
  })

  return {}
})
