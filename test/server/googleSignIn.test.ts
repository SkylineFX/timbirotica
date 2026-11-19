import { describe, it, expect, beforeEach } from 'vitest'
import { count, eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import { signInWithGoogle, hasOwnPassword, GOOGLE_ONLY_PASSWORD, type GoogleProfile } from '~~/server/utils/googleSignIn'
import { createTestDb, type TestDb } from './testDb'

// Runs the real Google sign-in reads and writes against an in-memory SQLite
// database built from server/db/schema.ts.
let db: TestDb

const NOW = new Date('2026-11-19T10:00:00Z')
const EARLIER = new Date('2026-11-01T10:00:00Z')
const SOMEONE_ELSES_HASH = '$2a$10$abcdefghijklmnopqrstuuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0'

const profile = (overrides: GoogleProfile = {}): GoogleProfile => ({
  email: 'ana@firma.ro',
  email_verified: true,
  given_name: 'Ana',
  family_name: 'Pop',
  ...overrides,
})

const addUser = async (values: Partial<typeof schema.users.$inferInsert> = {}) =>
  db.insert(schema.users).values({
    email: 'ana@firma.ro',
    firstName: 'Ana',
    lastName: 'Pop',
    password: SOMEONE_ELSES_HASH,
    createdAt: EARLIER,
    ...values,
  }).returning().get()

const userCount = async () => (await db.select({ n: count() }).from(schema.users))[0]!.n

const storedUser = async (id: number) =>
  db.query.users.findFirst({ where: eq(schema.users.id, id) })

beforeEach(async () => {
  db = await createTestDb()
})

describe('signInWithGoogle', () => {
  it('refuses an address that Google has not confirmed, even for an existing account', async () => {
    const existing = await addUser({ emailVerifiedAt: EARLIER })

    expect(await signInWithGoogle(db, profile({ email_verified: false }), NOW)).toEqual({ status: 'unverified' })
    expect(await signInWithGoogle(db, profile({ email_verified: 'true' }), NOW)).toEqual({ status: 'unverified' })
    expect(await signInWithGoogle(db, profile({ email: 'nou@firma.ro', email_verified: undefined }), NOW))
      .toEqual({ status: 'unverified' })

    expect(await userCount()).toBe(1)
    expect(await storedUser(existing.id)).toEqual(existing)
  })

  it('refuses a profile without an email address', async () => {
    expect(await signInWithGoogle(db, profile({ email: undefined }), NOW)).toEqual({ status: 'unverified' })
    expect(await signInWithGoogle(db, profile({ email: '   ' }), NOW)).toEqual({ status: 'unverified' })
    expect(await userCount()).toBe(0)
  })

  it('accepts the older verified_email flag', async () => {
    const result = await signInWithGoogle(db, profile({ email_verified: undefined, verified_email: true }), NOW)
    expect(result.status).toBe('signed-in')
  })

  it('creates a verified, Google-only account for a new address, stored in lower case', async () => {
    const result = await signInWithGoogle(db, profile({ email: '  Ana.Pop@Firma.RO ' }), NOW)

    expect(result.status).toBe('signed-in')
    if (result.status !== 'signed-in') return
    expect(result.isNewUser).toBe(true)
    expect(result.user).toMatchObject({
      email: 'ana.pop@firma.ro',
      firstName: 'Ana',
      lastName: 'Pop',
      password: GOOGLE_ONLY_PASSWORD,
      emailVerifiedAt: NOW,
      role: 'user',
    })
    expect(await storedUser(result.user.id)).toEqual(result.user)
  })

  it('splits the full name when Google sends no given or family name', async () => {
    const result = await signInWithGoogle(db, profile({ given_name: undefined, family_name: undefined, name: 'Ana Maria Pop' }), NOW)
    if (result.status !== 'signed-in') throw new Error('expected a sign-in')
    expect(result.user).toMatchObject({ firstName: 'Ana', lastName: 'Maria Pop' })
  })

  it('signs in to a verified account and keeps its password', async () => {
    const existing = await addUser({ emailVerifiedAt: EARLIER })

    const result = await signInWithGoogle(db, profile(), NOW)

    expect(result).toEqual({ status: 'signed-in', user: existing, isNewUser: false })
    expect(await storedUser(existing.id)).toEqual(existing)
  })

  it('removes the password of an unverified account when Google confirms the address', async () => {
    // Someone registered this address with their own password and never
    // confirmed it. The real owner now signs in with Google.
    const preRegistered = await addUser({ emailVerifiedAt: null })
    await db.insert(schema.emailVerificationTokens).values({
      userId: preRegistered.id, tokenHash: 'hash', expiresAt: 2_000_000_000, createdAt: 1_700_000_000,
    })

    const result = await signInWithGoogle(db, profile(), NOW)

    expect(result.status).toBe('signed-in')
    if (result.status !== 'signed-in') return
    expect(result.isNewUser).toBe(false)
    expect(result.user.id).toBe(preRegistered.id)

    const stored = await storedUser(preRegistered.id)
    expect(stored?.password).toBe(GOOGLE_ONLY_PASSWORD)
    expect(stored?.emailVerifiedAt).toEqual(NOW)
    expect(result.user).toEqual(stored)

    const tokens = await db.select().from(schema.emailVerificationTokens)
    expect(tokens).toEqual([])
  })

  it('finds an older account stored with capital letters instead of creating a second one', async () => {
    const existing = await addUser({ email: 'Ana@Firma.ro', password: GOOGLE_ONLY_PASSWORD, emailVerifiedAt: EARLIER })

    const result = await signInWithGoogle(db, profile({ email: 'Ana@Firma.ro' }), NOW)

    expect(result).toEqual({ status: 'signed-in', user: existing, isNewUser: false })
    expect(await userCount()).toBe(1)
  })
})

describe('hasOwnPassword', () => {
  it('is false only for the placeholder of a Google-only account', () => {
    expect(hasOwnPassword(GOOGLE_ONLY_PASSWORD)).toBe(false)
    expect(hasOwnPassword(SOMEONE_ELSES_HASH)).toBe(true)
  })
})
