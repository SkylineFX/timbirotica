import { eq } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10),
})

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { currentPassword, newPassword } = await readValidatedBody(event, bodySchema.parse)
  const db = useDrizzle()

  const user = await db.query.users.findFirst({
    where: eq(tables.users.id, session.user.id)
  })

  if (!user) {
    throw createError({ statusCode: 404, message: 'Utilizatorul nu a fost gasit.' })
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, user.password)
  if (!isCurrentValid) {
    throw createError({ statusCode: 401, message: 'Parola curenta este incorecta.' })
  }

  if (await bcrypt.compare(newPassword, user.password)) {
    throw createError({ statusCode: 400, message: 'Noua parola nu poate fi identica cu cea curenta.' })
  }

  const hashed = await bcrypt.hash(newPassword, 10)
  await db.update(tables.users).set({ password: hashed }).where(eq(tables.users.id, user.id))

  return { message: 'Parola a fost actualizata.' }
})
