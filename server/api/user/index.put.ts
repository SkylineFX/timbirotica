import { eq } from 'drizzle-orm'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  avatar: z.string().url().optional()
})

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const db = useDrizzle()

  const updatedUser = await db.update(tables.users)
    .set({
      name: body.name,
      email: body.email,
      avatar: body.avatar || 'https://raw.githubusercontent.com/creativetimofficial/public-assets/master/soft-ui-design-system/assets/img/marie.jpg',
    })
    .where(eq(tables.users.id, session.user.id))
    .returning({
      id: tables.users.id,
      name: tables.users.name,
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
      name: updatedUser[0].name,
    }
  })

  return updatedUser[0]
})
