import { describe, it, expect } from 'vitest'
import { parseSearchTerms, SEARCH_MAX_TERMS } from '~~/shared/utils/search'

const patternBytes = (term: string) => new TextEncoder().encode(`%${term}%`).length

describe('parseSearchTerms', () => {
  it('splits on whitespace and strips diacritics', () => {
    expect(parseSearchTerms('  Hârtie   copiator\tA4 ')).toEqual(['Hartie', 'copiator', 'A4'])
  })

  it('returns no terms for a blank query', () => {
    expect(parseSearchTerms('   ')).toEqual([])
  })

  it(`keeps only the first ${SEARCH_MAX_TERMS} words`, () => {
    const words = Array.from({ length: 60 }, (_, i) => `w${i}`)
    expect(parseSearchTerms(words.join(' '))).toEqual(words.slice(0, SEARCH_MAX_TERMS))
  })

  it('cuts a long word so its LIKE pattern fits in 50 bytes', () => {
    const [term] = parseSearchTerms('x'.repeat(200))
    expect(term).toBe('x'.repeat(48))
    expect(patternBytes(term!)).toBe(50)
  })

  it('counts bytes, not characters, for symbols outside ASCII', () => {
    const [term] = parseSearchTerms('€'.repeat(40))
    expect(term).toBe('€'.repeat(16))
    expect(patternBytes(term!)).toBeLessThanOrEqual(50)
  })
})
