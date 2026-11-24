import type { H3Event } from 'h3'
import { signInWithGoogle, type GoogleProfile } from '../../utils/googleSignIn'
import { safeRedirectPath, withQueryParam } from '~~/shared/utils/redirect'

// The page to return to after Google sends the visitor back (?redirect= on the
// first request, e.g. /checkout). It is kept in a cookie for the trip to
// Google and back, like the library's `state` cookie.
const REDIRECT_COOKIE = 'auth-redirect'
const REDIRECT_COOKIE_OPTIONS = { httpOnly: true, sameSite: 'lax', secure: !import.meta.dev, maxAge: 600, path: '/' } as const

function takeRedirect(event: H3Event): string | null {
  const target = safeRedirectPath(getCookie(event, REDIRECT_COOKIE))
  deleteCookie(event, REDIRECT_COOKIE, { path: '/' })
  return target
}

function loginPage(params: Record<string, string>, target: string | null): string {
  const query = new URLSearchParams(params)
  if (target) query.set('redirect', target)
  const qs = query.toString()
  return qs ? `/user/login?${qs}` : '/user/login'
}

// nuxt-auth-utils (0.5.32 and later) sets a random `state` cookie before the
// redirect to Google and rejects a callback whose `state` doesn't match, so a
// callback link made by someone else can't sign a visitor in to their account.
const googleSignIn = defineOAuthGoogleEventHandler({
  config: {
    // Always show Google's account list. Without it, a browser signed in to
    // one Google account that approved the shop before is signed in silently.
    // Customers often have a personal and a work account, and an order placed
    // on the wrong one is hard to undo. The consent screen still appears only
    // the first time.
    authorizationParams: { prompt: 'select_account' },
  },
  async onSuccess(event, { user: profile }: { user: GoogleProfile }) {
    const result = await signInWithGoogle(useDrizzle(), profile)
    const target = takeRedirect(event)

    if (result.status === 'unverified') {
      console.warn('Google sign-in refused: Google has not confirmed the account email address')
      return sendRedirect(event, loginPage({ error: 'oauth_unverified' }, target))
    }

    const { user, isNewUser } = result
    await saveUserSession(event, {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as 'user' | 'admin',
      },
      // Google sessions are always remembered (30 days). If this sign-in just
      // replaced the password of an unverified account, the stamp differs from
      // the one in sessions opened with that password, so those sessions end.
      secure: newSessionGuard(user.password, true),
    })

    // The query parameter lets app.vue confirm the sign-in with a toast, like
    // the login and register forms do. There is no client handler here.
    return sendRedirect(event, withQueryParam(target ?? '/', 'login', isNewUser ? 'google-new' : 'google'))
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, loginPage({ error: 'oauth_failed' }, takeRedirect(event)))
  }
})

export default defineEventHandler((event) => {
  const query = getQuery(event)

  // Google comes back with ?error= and no code when the visitor cancels on its
  // screen. The library would treat that as a new sign-in and send them
  // straight back to Google, so return to the login page instead. No error
  // message: cancelling was their choice.
  if (query.error && !query.code) {
    return sendRedirect(event, loginPage({}, takeRedirect(event)))
  }

  // First request, before the redirect to Google: remember where to return.
  if (!query.code) {
    const target = safeRedirectPath(query.redirect)
    if (target) setCookie(event, REDIRECT_COOKIE, target, REDIRECT_COOKIE_OPTIONS)
    else deleteCookie(event, REDIRECT_COOKIE, { path: '/' })
  }

  return googleSignIn(event)
})
