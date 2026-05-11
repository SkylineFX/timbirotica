import { z } from 'zod'
import bcrypt from 'bcryptjs'

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  remember: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const { email, password, remember } = await readValidatedBody(event, bodySchema.parse)
  const normalizedEmail = email.toLowerCase()
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
