import { createHash } from 'node:crypto'

/**
 * How long a session is accepted without "Tine-ma minte", in seconds. Its
 * cookie also ends when the browser closes.
 */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7

/** How long a session is accepted with "Tine-ma minte" or after Google sign-in, in seconds. */
export const REMEMBERED_SESSION_MAX_AGE = 60 * 60 * 24 * 30

/**
 * Server-only session fields, kept in the session's `secure` part, which
 * nuxt-auth-utils never sends to the browser. The cookie is sealed, so the
 * browser can't read or change them either.
 */
export interface SessionGuard {
  /** Fingerprint of the account's password hash when the session was opened. */
  passwordStamp: string
  /** Unix time in milliseconds after which the session is refused. */
  expiresAt: number
}

/**
 * Fingerprint of a stored password hash. It changes whenever the password
 * changes, whether by a password change, a reset or a Google claim
 * (server/utils/googleSignIn.ts). That ends every session opened before.
 * Django uses the same idea.
 */
export function passwordStamp(passwordHash: string): string {
  return createHash('sha256').update(`session:${passwordHash}`).digest('base64url')
}

export function newSessionGuard(passwordHash: string, maxAgeSeconds: number, now = Date.now()): SessionGuard {
  return { passwordStamp: passwordStamp(passwordHash), expiresAt: now + maxAgeSeconds * 1000 }
}

/**
 * Whether a signed-in session is still valid for the account it names. It
 * isn't when the account no longer exists, the session has expired or comes
 * from before this check existed, the password changed since sign-in, or the
 * role in the session differs from the database (an admin who lost the role
 * is signed out at once).
 */
export function isSessionCurrent(
  session: { user?: { role?: string }, secure?: Partial<SessionGuard> },
  account: { password: string, role: string } | undefined,
  now = Date.now(),
): boolean {
  const guard = session.secure
  if (!account || typeof guard?.passwordStamp !== 'string' || typeof guard.expiresAt !== 'number') return false
  if (now >= guard.expiresAt) return false
  if (session.user?.role !== account.role) return false
  return guard.passwordStamp === passwordStamp(account.password)
}
