import { safeRedirectPath } from '~~/shared/utils/redirect'

export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  // Already signed in: go where the sign-in would have led, or home.
  if (loggedIn.value) {
    return navigateTo(safeRedirectPath(to.query.redirect) ?? '/')
  }
})
