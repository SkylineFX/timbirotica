import { eq } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string()
    .min(8, 'Parola trebuie sa aiba cel putin 8 caractere')
    .regex(/[A-Z]/, 'Parola trebuie sa contina cel putin o litera mare')
    .regex(/[0-9]/, 'Parola trebuie sa contina cel putin o cifra'),
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

  // The account page shows "Seteaza o parola" instead of this form to
  // Google-only accounts. Without this check they would get "Parola curenta
  // este incorecta." for a password they never had.
  if (!hasOwnPassword(user.password)) {
    throw createError({ statusCode: 400, message: 'Contul tau nu are inca o parola. Cere pe email un link ca sa setezi una.' })
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

  // The new password changes the stamp, which signs out every other device.
  // Give this session the new stamp so it stays signed in, with its expiry
  // unchanged.
  await setUserSession(event, {
    secure: {
      passwordStamp: passwordStamp(hashed),
      expiresAt: session.secure?.expiresAt ?? Date.now() + SESSION_MAX_AGE * 1000,
    },
  })

  return { message: 'Parola a fost actualizata.' }
})
