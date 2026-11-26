declare module '#auth-utils' {
  interface User {
    id: number
    firstName: string
    lastName: string
    role: 'user' | 'admin'
  }

  // Server-only: nuxt-auth-utils never sends `secure` to the browser.
  // Checked on every request by server/middleware/session.ts.
  interface SecureSessionData {
    /** Fingerprint of the password hash at sign-in (server/utils/sessionCheck.ts). */
    passwordStamp: string
    /** Unix time in milliseconds after which the session is refused. */
    expiresAt: number
    /** Whether the cookie outlives the browser ("Tine-ma minte" or Google sign-in). */
    persistent?: boolean
  }
}

export { }
