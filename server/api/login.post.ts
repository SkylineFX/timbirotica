import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Messages match the login form's own validation (app/pages/user/login.vue).
const bodySchema = z.object({
  email: z.email('Adresa de email nu este valida'),
  password: z.string('Parola este obligatorie').min(1, 'Parola este obligatorie'),
  remember: z.boolean().optional(),
  turnstileToken: z.string('Verificare lipsa. Reincarca pagina si incearca din nou.').min(1, 'Verificare lipsa. Reincarca pagina si incearca din nou.'),
}, { error: 'Date invalide.' })

// Pre-computed bcrypt hash used to equalize response time when the email
// isn't found, preventing user enumeration via timing of login attempts.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10)

export default defineEventHandler(async (event) => {
  const { email, password, remember, turnstileToken } = await readBodyWithSchema(event, bodySchema)

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

  // A Google-only account has no hash, and comparing against its placeholder
  // returns at once. Compare against the dummy hash instead, so the answer
  // takes as long as any wrong password and doesn't reveal how the account
  // signs in.
  const canUsePassword = hasOwnPassword(user.password)
  const isPasswordValid = await bcrypt.compare(password, canUsePassword ? user.password : DUMMY_HASH) && canUsePassword

  if (!isPasswordValid) {
    throw createError({
      status: 401,
      message: 'Adresa de email sau parola incorecta.',
    })
  }

  // set the user session in the cookie. Without "Tine-ma minte" the cookie
  // ends when the browser closes, and the server refuses it after 7 days.
  await saveUserSession(event, {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as 'user' | 'admin',
    },
    secure: newSessionGuard(user.password, Boolean(remember)),
  })

  return {}
})
