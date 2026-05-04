import { z } from 'zod'
import bcrypt from 'bcryptjs'

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
})

export default defineEventHandler(async (event) => {
  const { email, password, firstName, lastName } = await readValidatedBody(event, registerSchema.parse)
  const normalizedEmail = email.toLowerCase()
  const db = useDrizzle()

  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(tables.users.email, normalizedEmail)
  })

  if (existingUser) {
    throw createError({
      status: 400,
      message: 'User already exists'
    })
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Insert user
  const newUser = await db.insert(tables.users).values({
    email: normalizedEmail,
    password: hashedPassword,
    firstName,
    lastName,
    createdAt: new Date()
  }).returning().get()

  // Log them in immediately
  await setUserSession(event, {
    user: {
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: 'user',
    }
  })

  return {}
})
