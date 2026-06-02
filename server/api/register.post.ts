import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { issueVerificationToken } from '../utils/emailVerification'

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(10),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().regex(/^0\d{9}$/),
  turnstileToken: z.string().min(1, 'Verificare lipsa. Reincarca pagina si incearca din nou.'),
})

export default defineEventHandler(async (event) => {
  const result = registerSchema.safeParse(await readBody(event))
  if (!result.success) {
    // First validation issue becomes the user-facing message — avoids leaking
    // the raw ZodError JSON to the client (which h3's readValidatedBody does).
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Date invalide.' })
  }
  const { email, password, firstName, lastName, phone, turnstileToken } = result.data

  // Cloudflare Turnstile verification — rejects bots/abuse before any DB work.
  const turnstile = await verifyTurnstileToken(turnstileToken)
  if (!turnstile.success) {
    throw createError({ statusCode: 400, message: 'Verificare esuata. Reincarca pagina si incearca din nou.' })
  }
  const normalizedEmail = email.trim().toLowerCase()
  const trimmedFirstName = firstName.trim()
  const trimmedLastName = lastName.trim()
  const db = useDrizzle()

  const existingUser = await db.query.users.findFirst({
    where: eq(tables.users.email, normalizedEmail)
  })

  if (existingUser) {
    throw createError({
      status: 400,
      message: 'Exista deja un cont cu aceasta adresa de email.'
    })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  let newUser: { id: number; email: string; firstName: string; lastName: string }
  try {
    newUser = await db.insert(tables.users).values({
      email: normalizedEmail,
      password: hashedPassword,
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      phone,
      createdAt: new Date()
    }).returning().get()
  } catch (err) {
    if (err instanceof Error && err.message.includes('UNIQUE constraint')) {
      throw createError({
        status: 400,
        message: 'Exista deja un cont cu aceasta adresa de email.'
      })
    }
    // Unexpected failure (DB down, etc.) — don't mislabel it as a duplicate; preserve the cause for Sentry
    console.error('Failed to create user', err)
    throw createError({
      statusCode: 500,
      message: 'Nu am putut crea contul. Incearca din nou.',
      cause: err
    })
  }

  // Log them in immediately
  await setUserSession(event, {
    user: {
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: 'user',
    }
  })

  try {
    await issueVerificationToken(event, { id: newUser.id, email: newUser.email, firstName: newUser.firstName })
  } catch (e) {
    console.error('Failed to send verification email at registration', e)
  }

  return {}
})
