// Signs out sessions that expired, were opened before a password change, or
// name a role or an account that no longer matches the database. It runs for
// every request with a session cookie, before any handler reads the session,
// so handlers can keep calling requireUserSession and getUserSession as before.
export default defineEventHandler(async (event) => {
  await validateUserSession(event)
})
