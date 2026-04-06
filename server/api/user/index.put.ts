import { eq } from 'drizzle-orm'
import { z } from 'zod'

const bodySchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email()
})

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const db = useDrizzle()

  const updatedUser = await db.update(tables.users)
    .set({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
    })
    .where(eq(tables.users.id, session.user.id))
    .returning({
      id: tables.users.id,
      firstName: tables.users.firstName,
      lastName: tables.users.lastName,
      email: tables.users.email,
      avatar: tables.users.avatar
    })

  if (!updatedUser || updatedUser.length === 0) {
    throw createError({
      statusCode: 404,
      message: 'User not found'
    })
  }

  // Update session
  await setUserSession(event, {
    user: {
      id: updatedUser[0].id,
      firstName: updatedUser[0].firstName,
      lastName: updatedUser[0].lastName,
    }
  })

  return updatedUser[0]
})
