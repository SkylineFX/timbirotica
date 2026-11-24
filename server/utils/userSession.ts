import type { H3Event } from 'h3'
import { sessionCookieExpires } from './sessionCheck'

/**
 * setUserSession, with the cookie ending when the session does: a remembered
 * session keeps its cookie until `secure.expiresAt`, any other session's
 * cookie ends when the browser closes. Write every session through this.
 *
 * Don't pass h3's maxAge instead. h3 counts it from when the cookie was first
 * created, which can be weeks before sign-in (the date was then already past),
 * and a later write without maxAge drops the cookie's expiry.
 */
export async function saveUserSession(event: H3Event, data: Parameters<typeof setUserSession>[1]) {
  const { secure } = await getUserSession(event)
  return setUserSession(event, data, {
    cookie: { expires: sessionCookieExpires({ ...secure, ...data.secure }) },
  })
}
