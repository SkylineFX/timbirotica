import type { H3Event } from 'h3'
import { isSessionCurrent } from './sessionCheck'

/**
 * Sign out a session that is no longer valid (see isSessionCurrent). This
 * reads the account's password hash and role by primary key. It runs once per
 * request, from server/middleware/session.ts and from requireAdminSession, so
 * every handler that reads the session afterwards sees the result.
 */
export async function validateUserSession(event: H3Event): Promise<void> {
  if (event.context.userSessionValidated) return
  event.context.userSessionValidated = true

  // getUserSession creates a new session cookie when the request has none, so
  // only look at requests that already carry one. Sessions can't arrive in a
  // header: nuxt.config.ts sets sessionHeader to false.
  const cookieName = useRuntimeConfig(event).session?.name || 'nuxt-session'
  if (!getCookie(event, cookieName)) return

  const session = await getUserSession(event)
  if (!session.user) return

  const account = await useDrizzle().query.users.findFirst({
    where: eq(tables.users.id, session.user.id),
    columns: { password: true, role: true },
  })
  if (isSessionCurrent(session, account)) return

  // clearUserSession alone isn't enough: a later read in this request would
  // unseal the request's cookie again. Replacing the data with nothing leaves
  // an empty session for the rest of the request and in the new cookie.
  await replaceUserSession(event, {})
}
