import { z } from 'zod'
import bcrypt from 'bcryptjs'

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(3),
  // avatar: z.string().url().optional().default('https://i.pravatar.cc/150'), 
  // Let's generate a default avatar based on name if not provided, or just use a placeholder
})

export default defineEventHandler(async (event) => {
  const { email, password, name } = await readValidatedBody(event, registerSchema.parse)
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
    name,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&rounded=true`,
    createdAt: new Date()
  }).returning().get()

  // Log them in immediately
  await setUserSession(event, {
    user: {
      id: newUser.id,
      name: newUser.name,
    }
  })

  return {}
})
