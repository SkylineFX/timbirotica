// Each search word becomes two LIKE patterns (name and sku) in every query of
// the product listing. D1 rejects a LIKE pattern over 50 bytes and a statement
// with more than 100 bound parameters, and a search that breaks either returns
// a 500 in production (local libsql allows both). Extra words are dropped and
// long words are cut, so a long search still finds what its first words find.
export const SEARCH_MAX_TERMS = 10
const LIKE_PATTERN_MAX_BYTES = 50

const encoder = new TextEncoder()

/** Cut a word so that `%word%` fits in D1's LIKE pattern limit. */
const fitLikePattern = (term: string): string => {
  let out = ''
  for (const ch of term) {
    if (encoder.encode(`%${out}${ch}%`).length > LIKE_PATTERN_MAX_BYTES) break
    out += ch
  }
  return out
}

/** The words of a search query, without diacritics, ready for `%word%` patterns. */
export function parseSearchTerms(q: string): string[] {
  return q.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, SEARCH_MAX_TERMS)
    .map(fitLikePattern)
}
