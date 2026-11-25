// Signs out sessions that expired, were opened before a password change, or
// name a role or an account that no longer matches the database. It runs for
// every request with a session cookie, before any handler reads the session,
// so handlers can keep calling requireUserSession and getUserSession as before.
// Public catalog endpoints never read the session and are skipped
// (SESSION_FREE_PATHS). Pages are still checked: nuxt-auth-utils loads the
// session during rendering through an internal request whose sign-out cookie
// doesn't reach the browser, so the page's own check is what clears it.
export default defineEventHandler(async (event) => {
  if (skipsSessionCheck(event.path)) return

  await validateUserSession(event)
})
