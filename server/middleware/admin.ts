export default defineEventHandler(async (event) => {
  const url = getRequestURL(event).pathname
  if (!url.startsWith('/api/admin/')) return

  const session = await requireUserSession(event)
  if (session.user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Acces interzis.' })
  }
})
