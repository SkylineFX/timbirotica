export default defineNuxtRouteMiddleware(async () => {
  const { loggedIn, fetch: refreshSession } = useUserSession()

  // Cached `loggedIn` can be stale (cookie expired, server restarted, session
  // revoked) — re-validate against the server before letting the user through,
  // otherwise protected pages render with null data instead of redirecting.
  if (import.meta.client) {
    await refreshSession()
  }

  if (!loggedIn.value) {
    return navigateTo('/user/login')
  }
})
