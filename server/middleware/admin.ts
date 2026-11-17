// First line of defence for /api/admin. Every admin handler also calls
// requireAdminSession itself, so a path this check misses still can't reach
// admin data.
//
// Match on event.path, the decoded path that the router also uses. Do not use
// getRequestURL(): it returns the raw URL, where /api/%61dmin/orders does not
// start with /api/admin/ but still routes to the admin handlers.
export default defineEventHandler(async (event) => {
  const path = (event.path.split('?')[0] ?? '').replace(/\/{2,}/g, '/')
  if (path !== '/api/admin' && !path.startsWith('/api/admin/')) return

  await requireAdminSession(event)
})
