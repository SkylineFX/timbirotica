import { describe, it, expect } from 'vitest'
import { isCrossOriginWrite } from '~~/server/utils/originCheck'

const host = 'timbirotica.ro'

describe('isCrossOriginWrite', () => {
  it('lets writes from the site itself through', () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'post']) {
      expect(isCrossOriginWrite({ method, origin: 'https://timbirotica.ro', host })).toBe(false)
    }
    expect(isCrossOriginWrite({ method: 'POST', origin: 'http://localhost:3000', host: 'localhost:3000' })).toBe(false)
    expect(isCrossOriginWrite({ method: 'POST', origin: 'https://Timbirotica.ro', host: 'TIMBIROTICA.RO' })).toBe(false)
  })

  it('refuses writes from other hosts, subdomains included', () => {
    for (const origin of ['https://evil.example', 'https://cdn.timbirotica.ro', 'https://timbirotica.ro.evil.example', 'http://localhost:3001', 'null', 'not a url']) {
      expect(isCrossOriginWrite({ method: 'POST', origin, host })).toBe(true)
    }
    expect(isCrossOriginWrite({ method: 'DELETE', origin: 'https://cdn.timbirotica.ro', host })).toBe(true)
  })

  it('lets reads and requests without an Origin header through', () => {
    expect(isCrossOriginWrite({ method: 'GET', origin: 'https://evil.example', host })).toBe(false)
    expect(isCrossOriginWrite({ method: 'HEAD', origin: 'https://evil.example', host })).toBe(false)
    expect(isCrossOriginWrite({ method: 'POST', origin: undefined, host })).toBe(false)
  })

  it('refuses a write with an Origin header when the host is unknown', () => {
    expect(isCrossOriginWrite({ method: 'POST', origin: 'https://timbirotica.ro', host: undefined })).toBe(true)
  })
})
