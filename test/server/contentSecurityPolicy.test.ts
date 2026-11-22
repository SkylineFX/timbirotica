import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  addScriptNonce, contentSecurityPolicy, createCspNonce, NUXT_IMG_ONERROR_HASH,
} from '~~/server/utils/contentSecurityPolicy'

const NUXT_IMG_SOURCE = new URL('../../node_modules/@nuxt/image/dist/runtime/components/NuxtImg.vue', import.meta.url)

describe('createCspNonce', () => {
  it('makes a new base64 nonce of 16 random bytes each time', () => {
    const nonces = new Set(Array.from({ length: 50 }, createCspNonce))
    expect(nonces.size).toBe(50)
    for (const nonce of nonces) expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/)
  })
})

describe('contentSecurityPolicy', () => {
  it('allows scripts from this site, Turnstile, the nonce and the image handler only', () => {
    const policy = contentSecurityPolicy('abc')
    expect(policy).toContain(`script-src 'self' 'nonce-abc' 'unsafe-hashes' '${NUXT_IMG_ONERROR_HASH}' https://challenges.cloudflare.com;`)
    expect(policy).not.toMatch(/script-src[^;]*'unsafe-(inline|eval)'/)
    expect(policy).toContain("frame-ancestors 'self'")
    expect(policy).toContain("object-src 'none'")
  })

  it('has the hash of the onerror handler that NuxtImg renders', () => {
    const source = readFileSync(NUXT_IMG_SOURCE, 'utf8')
    const handler = source.match(/onerror: "([^"]+)"/)?.[1]
    expect(handler).toBe("this.setAttribute('data-error', 1)")
    expect(`sha256-${createHash('sha256').update(handler!).digest('base64')}`).toBe(NUXT_IMG_ONERROR_HASH)
  })
})

describe('addScriptNonce', () => {
  it('adds the nonce to every script tag', () => {
    const html = '<script type="module" src="/_nuxt/a.js"></script><script>window.__NUXT__={}</script>'
      + '<SCRIPT\ntype="application/json">{}</SCRIPT>'
    expect(addScriptNonce(html, 'n1')).toBe(
      '<script nonce="n1" type="module" src="/_nuxt/a.js"></script><script nonce="n1">window.__NUXT__={}</script>'
      + '<script nonce="n1"\ntype="application/json">{}</SCRIPT>'
    )
  })

  it('leaves other tags that start with "script" alone', () => {
    const html = '<scripts></scripts><link rel="modulepreload" href="/_nuxt/b.js">'
    expect(addScriptNonce(html, 'n1')).toBe(html)
  })
})
