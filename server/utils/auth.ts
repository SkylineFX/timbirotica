import type { H3Event } from 'h3'

/**
 * Require a logged-in admin and return the session.
 *
 * Call this at the top of every handler under server/api/admin. The admin
 * middleware runs first, but a handler must not rely on it alone: if a request
 * path ever slips past the middleware's path check, this call still stops it.
 */
export async function requireAdminSession(event: H3Event) {
  const session = await requireUserSession(event)
  if (session.user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Acces interzis.' })
  }
  return session
}
