declare module '#auth-utils' {
  interface User {
    id: number
    firstName: string
    lastName: string
    role: 'user' | 'admin'
  }

  interface UserSession {
    // Add any other session properties if needed
  }

  // Server-only: nuxt-auth-utils never sends `secure` to the browser.
  // Checked on every request by server/middleware/session.ts.
  interface SecureSessionData {
    /** Fingerprint of the password hash at sign-in (server/utils/sessionCheck.ts). */
    passwordStamp: string
    /** Unix time in milliseconds after which the session is refused. */
    expiresAt: number
  }
}

export { }
