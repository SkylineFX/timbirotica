import { eq } from 'drizzle-orm'
import { z } from 'zod'

const bodySchema = z.object({
  firstName: z.string().min(2, 'Prenumele trebuie sa aiba cel putin 2 caractere'),
  lastName: z.string().min(2, 'Numele trebuie sa aiba cel putin 2 caractere'),
  phone: z.string().regex(/^0\d{9}$/, 'Numar de telefon invalid').or(z.literal('')),
})

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const result = bodySchema.safeParse(await readBody(event))
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Date invalide.' })
  }
  const body = result.data
  const db = useDrizzle()

  const [updatedUser] = await db.update(tables.users)
    .set({
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone || null,
    })
    .where(eq(tables.users.id, session.user.id))
    .returning({
      id: tables.users.id,
      firstName: tables.users.firstName,
      lastName: tables.users.lastName,
      phone: tables.users.phone,
      email: tables.users.email,
    })

  if (!updatedUser) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  await setUserSession(event, {
    user: {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: session.user.role,
    }
  })

  return updatedUser
})
