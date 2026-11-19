import { describe, it, expect } from 'vitest'
import {
  isSessionCurrent, newSessionGuard, passwordStamp,
  SESSION_MAX_AGE, REMEMBERED_SESSION_MAX_AGE,
} from '~~/server/utils/sessionCheck'
import { GOOGLE_ONLY_PASSWORD } from '~~/server/utils/googleSignIn'

const NOW = Date.parse('2026-11-19T10:00:00Z')
const DAY = 24 * 60 * 60 * 1000
const HASH = '$2a$10$abcdefghijklmnopqrstuuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0'
const NEW_HASH = '$2a$10$0ZYXWVUTSRQPONMLKJIHGFEDCBAzyxwvutsrqpomlkjihgfedcbaZ'

const account = (overrides: Partial<{ password: string, role: string }> = {}) =>
  ({ password: HASH, role: 'user', ...overrides })

const sessionFor = (passwordHash = HASH, role = 'user', maxAge = SESSION_MAX_AGE) =>
  ({ user: { role }, secure: newSessionGuard(passwordHash, maxAge, NOW) })

describe('passwordStamp', () => {
  it('is the same for the same hash and differs when the password changes', () => {
    expect(passwordStamp(HASH)).toBe(passwordStamp(HASH))
    expect(passwordStamp(NEW_HASH)).not.toBe(passwordStamp(HASH))
  })

  it('does not contain the hash itself', () => {
    expect(passwordStamp(HASH)).not.toContain(HASH.slice(7))
  })
})

describe('newSessionGuard', () => {
  it('expires after 7 days, or 30 when remembered', () => {
    expect(newSessionGuard(HASH, SESSION_MAX_AGE, NOW).expiresAt).toBe(NOW + 7 * DAY)
    expect(newSessionGuard(HASH, REMEMBERED_SESSION_MAX_AGE, NOW).expiresAt).toBe(NOW + 30 * DAY)
  })
})

describe('isSessionCurrent', () => {
  it('accepts a session for an unchanged account before it expires', () => {
    expect(isSessionCurrent(sessionFor(), account(), NOW)).toBe(true)
    expect(isSessionCurrent(sessionFor(), account(), NOW + 7 * DAY - 1)).toBe(true)
  })

  it('refuses a session once it has expired', () => {
    expect(isSessionCurrent(sessionFor(), account(), NOW + 7 * DAY)).toBe(false)
    const remembered = sessionFor(HASH, 'user', REMEMBERED_SESSION_MAX_AGE)
    expect(isSessionCurrent(remembered, account(), NOW + 29 * DAY)).toBe(true)
    expect(isSessionCurrent(remembered, account(), NOW + 30 * DAY)).toBe(false)
  })

  it('refuses a session opened before the password changed', () => {
    expect(isSessionCurrent(sessionFor(HASH), account({ password: NEW_HASH }), NOW)).toBe(false)
  })

  it('refuses the registrant\'s session after Google sign-in claims the account', () => {
    expect(isSessionCurrent(sessionFor(HASH), account({ password: GOOGLE_ONLY_PASSWORD }), NOW)).toBe(false)
  })

  it('refuses a session whose role differs from the database', () => {
    expect(isSessionCurrent(sessionFor(HASH, 'admin'), account({ role: 'user' }), NOW)).toBe(false)
    expect(isSessionCurrent(sessionFor(HASH, 'user'), account({ role: 'admin' }), NOW)).toBe(false)
    expect(isSessionCurrent(sessionFor(HASH, 'admin'), account({ role: 'admin' }), NOW)).toBe(true)
  })

  it('refuses a session for an account that no longer exists', () => {
    expect(isSessionCurrent(sessionFor(), undefined, NOW)).toBe(false)
  })

  it('refuses sessions from before this check, without the server-only fields', () => {
    expect(isSessionCurrent({ user: { role: 'user' } }, account(), NOW)).toBe(false)
    expect(isSessionCurrent({ user: { role: 'user' }, secure: { passwordStamp: passwordStamp(HASH) } }, account(), NOW)).toBe(false)
    expect(isSessionCurrent({ user: { role: 'user' }, secure: { expiresAt: NOW + DAY } }, account(), NOW)).toBe(false)
  })
})
