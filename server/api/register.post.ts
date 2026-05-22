import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { issueVerificationToken } from '../utils/emailVerification'

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
})

export default defineEventHandler(async (event) => {
  const { email, password, firstName, lastName } = await readValidatedBody(event, registerSchema.parse)
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
