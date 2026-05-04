export default defineNuxtRouteMiddleware(() => {
  const { user, loggedIn } = useUserSession()
  if (!loggedIn.value) {
    return navigateTo('/user/login')
  }
  if (user.value?.role !== 'admin') {
    return navigateTo('/')
  }
})
