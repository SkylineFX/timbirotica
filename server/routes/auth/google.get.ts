import { signInWithGoogle, type GoogleProfile } from '../../utils/googleSignIn'

// nuxt-auth-utils (0.5.32 and later) sets a random `state` cookie before the
// redirect to Google and rejects a callback whose `state` doesn't match, so a
// callback link made by someone else can't sign a visitor in to their account.
export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user: profile }: { user: GoogleProfile }) {
    const result = await signInWithGoogle(useDrizzle(), profile)

    if (result.status === 'unverified') {
      console.warn('Google sign-in refused: Google has not confirmed the account email address')
      return sendRedirect(event, '/user/login?error=oauth_unverified')
    }

    const { user, isNewUser } = result
    await setUserSession(event, {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as 'user' | 'admin',
      },
      // If this sign-in just replaced the password of an unverified account,
      // the stamp differs from the one in sessions opened with that password,
      // so those sessions end.
      secure: newSessionGuard(user.password, REMEMBERED_SESSION_MAX_AGE),
    }, {
      // Keep Google-authenticated sessions alive for 30 days automatically
      maxAge: REMEMBERED_SESSION_MAX_AGE
    })

    // The query parameter lets app.vue confirm the sign-in with a toast, like
    // the login and register forms do. There is no client handler here.
    return sendRedirect(event, isNewUser ? '/?login=google-new' : '/?login=google')
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/user/login?error=oauth_failed')
  }
})
