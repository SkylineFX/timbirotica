import { describe, it, expect } from 'vitest'
import {
  isSessionCurrent,
  newSessionGuard,
  passwordStamp,
  sessionCookieExpires,
  skipsSessionCheck
} from '~~/server/utils/sessionCheck'
import { GOOGLE_ONLY_PASSWORD } from '~~/server/utils/googleSignIn'

const NOW = Date.parse('2026-11-19T10:00:00Z')
const DAY = 24 * 60 * 60 * 1000
const HASH = '$2a$10$abcdefghijklmnopqrstuuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0'
const NEW_HASH = '$2a$10$0ZYXWVUTSRQPONMLKJIHGFEDCBAzyxwvutsrqpomlkjihgfedcbaZ'

const account = (overrides: Partial<{ password: string; role: string }> = {}) => ({
  password: HASH,
  role: 'user',
  ...overrides
})

const sessionFor = (passwordHash = HASH, role = 'user', remember = false) => ({
  user: { role },
  secure: newSessionGuard(passwordHash, remember, NOW)
})

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
    expect(newSessionGuard(HASH, false, NOW).expiresAt).toBe(NOW + 7 * DAY)
    expect(newSessionGuard(HASH, true, NOW).expiresAt).toBe(NOW + 30 * DAY)
  })
})

describe('sessionCookieExpires', () => {
  it("ends a remembered session's cookie with the session", () => {
    expect(sessionCookieExpires(newSessionGuard(HASH, true, NOW))).toEqual(new Date(NOW + 30 * DAY))
  })

  it('ends any other cookie when the browser closes', () => {
    expect(sessionCookieExpires(newSessionGuard(HASH, false, NOW))).toBeUndefined()
    // Sessions opened before the flag existed, and guests.
    expect(sessionCookieExpires({ passwordStamp: 'x', expiresAt: NOW + DAY })).toBeUndefined()
    expect(sessionCookieExpires(undefined)).toBeUndefined()
  })
})

describe('isSessionCurrent', () => {
  it('accepts a session for an unchanged account before it expires', () => {
    expect(isSessionCurrent(sessionFor(), account(), NOW)).toBe(true)
    expect(isSessionCurrent(sessionFor(), account(), NOW + 7 * DAY - 1)).toBe(true)
  })

  it('refuses a session once it has expired', () => {
    expect(isSessionCurrent(sessionFor(), account(), NOW + 7 * DAY)).toBe(false)
    const remembered = sessionFor(HASH, 'user', true)
    expect(isSessionCurrent(remembered, account(), NOW + 29 * DAY)).toBe(true)
    expect(isSessionCurrent(remembered, account(), NOW + 30 * DAY)).toBe(false)
  })

  it('refuses a session opened before the password changed', () => {
    expect(isSessionCurrent(sessionFor(HASH), account({ password: NEW_HASH }), NOW)).toBe(false)
  })

  it("refuses the registrant's session after Google sign-in claims the account", () => {
    expect(
      isSessionCurrent(sessionFor(HASH), account({ password: GOOGLE_ONLY_PASSWORD }), NOW)
    ).toBe(false)
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
    expect(
      isSessionCurrent(
        { user: { role: 'user' }, secure: { passwordStamp: passwordStamp(HASH) } },
        account(),
        NOW
      )
    ).toBe(false)
    expect(
      isSessionCurrent({ user: { role: 'user' }, secure: { expiresAt: NOW + DAY } }, account(), NOW)
    ).toBe(false)
  })
})

describe('skipsSessionCheck', () => {
  it('skips the public catalog endpoints', () => {
    for (const path of [
      '/api/products',
      '/api/products?q=pix&limit=10',
      '/api/products/pix-albastru',
      '/api/categories/tree',
      '/api/brands',
      '/api/locations/cities?countyName=Alba',
      '/api/__sitemap__/urls',
      '//api//products'
    ])
      expect(skipsSessionCheck(path), path).toBe(true)
  })

  it('checks pages and every other endpoint', () => {
    for (const path of [
      '/',
      '/c/radiere',
      '/user/comenzi',
      '/api/_auth/session',
      '/api/cart',
      '/api/favorites',
      '/api/orders',
      '/api/user/orders',
      '/api/admin/products',
      '/auth/google',
      '/api/productsx',
      '/api/brands-admin',
      '/api',
      '/api/cart?x=/api/products'
    ])
      expect(skipsSessionCheck(path), path).toBe(false)
  })
})
