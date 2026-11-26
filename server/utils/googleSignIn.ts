import { eq, sql } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import * as schema from '../db/schema'

/** Stored instead of a bcrypt hash for accounts that sign in only with Google. */
export const GOOGLE_ONLY_PASSWORD = 'OAUTH_USER'

/** Whether the account has a password of its own, so it isn't Google-only. */
export function hasOwnPassword(storedPassword: string): boolean {
  return storedPassword !== GOOGLE_ONLY_PASSWORD
}

/** The fields of Google's userinfo response that sign-in uses. */
export interface GoogleProfile {
  email?: unknown
  email_verified?: unknown
  verified_email?: unknown
  given_name?: unknown
  family_name?: unknown
  name?: unknown
}

export type GoogleSignInResult =
  | { status: 'unverified' }
  | { status: 'signed-in'; user: typeof schema.users.$inferSelect; isNewUser: boolean }

type Db = LibSQLDatabase<typeof schema>

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

async function findUserByEmail(db: Db, email: string) {
  const exact = await db.query.users.findFirst({ where: eq(schema.users.email, email) })
  if (exact) return exact
  // Google sign-in used to store the address exactly as Google sent it, so an
  // older account may have capital letters. Registration always stored it in
  // lower case. This match can't use the email index, so it runs only when the
  // exact one finds nothing, which is just before a new account is created.
  return db.query.users.findFirst({ where: sql`lower(trim(${schema.users.email})) = ${email}` })
}

/**
 * Find or create the account for a Google sign-in.
 *
 * Google is trusted only for an address it has confirmed. A confirmed address
 * proves the person owns the mailbox, but not that they chose a password
 * stored on an unverified account with that address: anyone can register any
 * address with a password of their own. So when Google confirms such an
 * account, its password is replaced and its pending verification links are
 * deleted. Otherwise whoever registered the address could keep logging in to
 * the account the real owner now uses.
 */
export async function signInWithGoogle(
  db: Db,
  profile: GoogleProfile,
  now = new Date()
): Promise<GoogleSignInResult> {
  const email = text(profile.email).toLowerCase()
  const verified = profile.email_verified === true || profile.verified_email === true
  if (!email || !verified) return { status: 'unverified' }

  const existing = await findUserByEmail(db, email)

  if (!existing) {
    const fullName = text(profile.name)
    const user = await db
      .insert(schema.users)
      .values({
        email,
        firstName: text(profile.given_name) || fullName.split(' ')[0] || 'Utilizator',
        lastName: text(profile.family_name) || fullName.split(' ').slice(1).join(' '),
        password: GOOGLE_ONLY_PASSWORD,
        emailVerifiedAt: now,
        createdAt: now
      })
      .returning()
      .get()
    return { status: 'signed-in', user, isNewUser: true }
  }

  if (!existing.emailVerifiedAt) {
    // The update and the token cleanup run in one batch, so they are saved together.
    await db.batch([
      db
        .update(schema.users)
        .set({ emailVerifiedAt: now, password: GOOGLE_ONLY_PASSWORD })
        .where(eq(schema.users.id, existing.id)),
      db
        .delete(schema.emailVerificationTokens)
        .where(eq(schema.emailVerificationTokens.userId, existing.id))
    ])
    return {
      status: 'signed-in',
      user: { ...existing, emailVerifiedAt: now, password: GOOGLE_ONLY_PASSWORD },
      isNewUser: false
    }
  }

  return { status: 'signed-in', user: existing, isNewUser: false }
}
