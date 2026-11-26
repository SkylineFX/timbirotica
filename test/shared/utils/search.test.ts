import { describe, it, expect } from 'vitest'
import {
  parseSearchTerms,
  buildSearchMatch,
  isSearchLongEnough,
  SEARCH_MAX_TERMS,
  SEARCH_MAX_TERM_LENGTH
} from '~~/shared/utils/search'

describe('isSearchLongEnough', () => {
  it('runs a search of 2 characters or more, whatever they are', () => {
    for (const q of ['ab', 'a4', '80', 'g.', '..', 'ș ș', 'pix'])
      expect(isSearchLongEnough(q), q).toBe(true)
  })

  it('does not run a shorter search, not counting spaces around it', () => {
    for (const q of ['', ' ', 'c', ' c ', '2', '😀']) expect(isSearchLongEnough(q), q).toBe(false)
  })
})

describe('parseSearchTerms', () => {
  it('splits on whitespace and strips diacritics', () => {
    expect(parseSearchTerms('  Hârtie   copiator\tA4 ')).toEqual(['Hartie', 'copiator', 'A4'])
  })

  it('splits on control characters such as NUL', () => {
    expect(parseSearchTerms('pix\u0000gel\u0007a4')).toEqual(['pix', 'gel', 'a4'])
  })

  it('returns no terms for a blank query', () => {
    expect(parseSearchTerms('   ')).toEqual([])
  })

  it(`keeps only the first ${SEARCH_MAX_TERMS} words`, () => {
    const words = Array.from({ length: 60 }, (_, i) => `w${i}`)
    expect(parseSearchTerms(words.join(' '))).toEqual(words.slice(0, SEARCH_MAX_TERMS))
  })

  it(`cuts a long word to ${SEARCH_MAX_TERM_LENGTH} characters`, () => {
    expect(parseSearchTerms('x'.repeat(200))).toEqual(['x'.repeat(SEARCH_MAX_TERM_LENGTH)])
  })

  it('counts characters, not UTF-16 units, when cutting', () => {
    expect(parseSearchTerms('😀'.repeat(60))).toEqual(['😀'.repeat(SEARCH_MAX_TERM_LENGTH)])
  })
})

describe('buildSearchMatch', () => {
  it('quotes each word as a prefix, and requires all of them', () => {
    expect(buildSearchMatch(['pix', 'albastru'])).toBe('"pix"* AND "albastru"*')
  })

  it('searches FTS5 operators as plain words', () => {
    expect(buildSearchMatch(['pix', 'OR', 'NEAR', 'caiet*'])).toBe(
      '"pix"* AND "OR"* AND "NEAR"* AND "caiet*"*'
    )
  })

  it('doubles quotes inside a word', () => {
    expect(buildSearchMatch(['pix"', '"A4"'])).toBe('"pix"""* AND """A4"""*')
  })

  it('matches a number and a unit typed apart in either spelling', () => {
    expect(buildSearchMatch(['pix', '0.7', 'mm'])).toBe('"pix"* AND ("0.7 mm"* OR "0.7mm"*)')
    expect(buildSearchMatch(['80', 'G'])).toBe('("80 G"* OR "80G"*)')
  })

  it('matches a number glued to a unit in either spelling', () => {
    expect(buildSearchMatch(['30cm'])).toBe('("30cm"* OR "30 cm"*)')
    expect(buildSearchMatch(['0,7MM'])).toBe('("0,7MM"* OR "0,7 MM"*)')
  })

  it('leaves a number followed by an ordinary word alone', () => {
    expect(buildSearchMatch(['set', '2', 'pixuri'])).toBe('"set"* AND "2"* AND "pixuri"*')
    expect(buildSearchMatch(['a4', 'q560'])).toBe('"a4"* AND "q560"*')
  })

  it('asks for whole words when told to', () => {
    expect(buildSearchMatch(['pix', 'albastru'], { wholeWords: true })).toBe('"pix" AND "albastru"')
    expect(buildSearchMatch(['pix', '0.7', 'mm'], { wholeWords: true })).toBe(
      '"pix" AND ("0.7 mm" OR "0.7mm")'
    )
  })

  it('drops words that have no letter or digit', () => {
    expect(buildSearchMatch(['-', 'pix', '&', '"'])).toBe('"pix"*')
  })

  it('returns null when no word is left', () => {
    expect(buildSearchMatch([])).toBeNull()
    expect(buildSearchMatch(['-', '%', '""'])).toBeNull()
  })
})
