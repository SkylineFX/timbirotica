export default defineNuxtRouteMiddleware(async (to) => {
  const { user, loggedIn, fetch: refreshSession } = useUserSession()

  if (import.meta.client) {
    await refreshSession()
  }

  if (!loggedIn.value) {
    return navigateTo({ path: '/user/login', query: { redirect: to.fullPath } })
  }
  if (user.value?.role !== 'admin') {
    return navigateTo('/')
  }
})
