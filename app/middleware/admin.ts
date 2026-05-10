export default defineNuxtRouteMiddleware(async () => {
  const { user, loggedIn, fetch: refreshSession } = useUserSession()

  if (import.meta.client) {
    await refreshSession()
  }

  if (!loggedIn.value) {
    return navigateTo('/user/login')
  }
  if (user.value?.role !== 'admin') {
    return navigateTo('/')
  }
})
