import { z } from 'zod'
import bcrypt from 'bcryptjs'
import * as Sentry from '@sentry/nuxt'
import { issueVerificationToken } from '../utils/emailVerification'

// Messages match the registration form's own validation (app/pages/user/register.vue).
const registerSchema = z.object({
  email: z.email('Adresa de email nu este valida'),
  password: z.string('Parola este obligatorie')
    .min(8, 'Parola trebuie sa aiba cel putin 8 caractere')
    .regex(/[A-Z]/, 'Parola trebuie sa contina cel putin o litera mare')
    .regex(/[0-9]/, 'Parola trebuie sa contina cel putin o cifra'),
  firstName: z.string('Prenumele este obligatoriu').min(2, 'Prenumele prea scurt'),
  lastName: z.string('Numele este obligatoriu').min(2, 'Numele prea scurt'),
  phone: z.string('Numarul de telefon este obligatoriu').regex(/^0\d{9}$/, 'Numar de telefon invalid'),
  turnstileToken: z.string('Verificare lipsa. Reincarca pagina si incearca din nou.').min(1, 'Verificare lipsa. Reincarca pagina si incearca din nou.'),
}, { error: 'Date invalide.' })

export default defineEventHandler(async (event) => {
  const { email, password, firstName, lastName, phone, turnstileToken } = await readBodyWithSchema(event, registerSchema)

  // Cloudflare Turnstile verification — rejects bots/abuse before any DB work.
  const turnstile = await verifyTurnstileToken(turnstileToken, event)
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
  await saveUserSession(event, {
    user: {
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: 'user',
    },
    secure: newSessionGuard(hashedPassword, false),
  })

  try {
    await issueVerificationToken(event, { id: newUser.id, email: newUser.email, firstName: newUser.firstName })
  } catch (e) {
    // The account is created either way; the user can ask for a new email.
    // Report it to Sentry so a failing email service doesn't go unnoticed.
    console.error('Failed to send verification email at registration', e)
    Sentry.captureException(e, { tags: { area: 'registration-verification-email', userId: newUser.id } })
  }

  return {}
})
