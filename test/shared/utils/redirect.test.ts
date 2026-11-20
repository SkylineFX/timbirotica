import { describe, it, expect } from 'vitest'
import { safeRedirectPath, withQueryParam } from '~~/shared/utils/redirect'

describe('safeRedirectPath', () => {
  it('accepts pages of this site, with their query and hash', () => {
    expect(safeRedirectPath('/checkout')).toBe('/checkout')
    expect(safeRedirectPath('/user/comenzi')).toBe('/user/comenzi')
    expect(safeRedirectPath('/c/hartie/hartie-a4?sort=pret#detalii')).toBe('/c/hartie/hartie-a4?sort=pret#detalii')
    expect(safeRedirectPath('/')).toBe('/')
  })

  it('takes the first value when the query parameter repeats', () => {
    expect(safeRedirectPath(['/checkout', '/user'])).toBe('/checkout')
  })

  it('refuses anything that could leave the site', () => {
    for (const value of [
      'https://evil.example',
      'http://evil.example/checkout',
      '//evil.example',
      '//evil.example/checkout',
      '/\\evil.example',
      '/\t/evil.example',
      '/\n/evil.example',
      'javascript:alert(1)',
      'checkout',
      ' /checkout',
    ]) {
      expect(safeRedirectPath(value), value).toBeNull()
    }
  })

  it('refuses the sign-in pages themselves', () => {
    expect(safeRedirectPath('/user/login')).toBeNull()
    expect(safeRedirectPath('/user/login?redirect=/checkout')).toBeNull()
    expect(safeRedirectPath('/user/register')).toBeNull()
    expect(safeRedirectPath('/auth/google')).toBeNull()
  })

  it('refuses missing, non-string and oversized values', () => {
    expect(safeRedirectPath(undefined)).toBeNull()
    expect(safeRedirectPath(null)).toBeNull()
    expect(safeRedirectPath('')).toBeNull()
    expect(safeRedirectPath(42)).toBeNull()
    expect(safeRedirectPath([])).toBeNull()
    expect(safeRedirectPath('/' + 'a'.repeat(1000))).toBeNull()
  })
})

describe('withQueryParam', () => {
  it('adds the parameter', () => {
    expect(withQueryParam('/', 'login', 'google')).toBe('/?login=google')
    expect(withQueryParam('/checkout', 'login', 'google-new')).toBe('/checkout?login=google-new')
  })

  it('keeps other parameters and the hash', () => {
    expect(withQueryParam('/c/hartie?sort=pret#lista', 'login', 'google')).toBe('/c/hartie?sort=pret&login=google#lista')
  })

  it('replaces an existing value', () => {
    expect(withQueryParam('/?login=google', 'login', 'google-new')).toBe('/?login=google-new')
  })
})
