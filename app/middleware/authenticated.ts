export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, fetch: refreshSession } = useUserSession()

  // Cached `loggedIn` can be stale (cookie expired, server restarted, session
  // revoked) — re-validate against the server before letting the user through,
  // otherwise protected pages render with null data instead of redirecting.
  if (import.meta.client) {
    await refreshSession()
  }

  if (!loggedIn.value) {
    // Come back here after signing in, e.g. to the checkout with a full cart.
    return navigateTo({ path: '/user/login', query: { redirect: to.fullPath } })
  }
})
