// Product search runs on the products_fts full-text index (scripts/search-fts.sql).
// A search keeps its first 10 words, each cut to 48 characters, so a pasted
// paragraph still runs as a small query and finds what its first words find.
export const SEARCH_MAX_TERMS = 10
export const SEARCH_MAX_TERM_LENGTH = 48
export const SEARCH_MIN_LENGTH = 2

/** Whether a typed search is long enough to run: at least 2 characters, not counting spaces around it. */
export const isSearchLongEnough = (q: string): boolean =>
  Array.from(q.trim()).length >= SEARCH_MIN_LENGTH

/**
 * The words of a search query, without diacritics. Control characters count as
 * spaces: FTS5 reads a NUL (`%00` in the URL) as the end of a quoted word.
 */
export function parseSearchTerms(q: string): string[] {
  return q
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\p{Cc}/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, SEARCH_MAX_TERMS)
    .map((term) => Array.from(term).slice(0, SEARCH_MAX_TERM_LENGTH).join(''))
}

// Units that product names write both glued to the number ("0.7MM", "80G",
// "100ML") and apart from it ("30 CM", "100 BUC", "80 MICRONI").
const UNITS = new Set(['mm', 'cm', 'm', 'ml', 'l', 'g', 'gr', 'kg', 'buc', 'microni', 'gb', 'mb'])
const NUMBER = /^\d+(?:[.,]\d+)?$/
const NUMBER_AND_UNIT = /^(\d+(?:[.,]\d+)?)(\p{L}+)$/u

/**
 * The FTS5 MATCH expression for search words. Every word must appear as the
 * start of a word in the product name or SKU, so "pix" finds "PIXURI" and
 * "caiet" finds "CAIETE", as the LIKE search did. With `wholeWords`, each word
 * must appear whole instead ("pix" finds "PIX" but not "PIXEL"); the listing
 * uses that to rank whole-word matches first. A number and a unit match both
 * spellings: "0.7 mm" and "0.7mm" each find "0.7MM" and "0.7 MM".
 * Each word is quoted, so FTS5 syntax typed by a customer (AND, NEAR, *,
 * quotes) is searched as text. Words with no letter or digit are dropped,
 * since the index holds no punctuation. Returns null when no word is left.
 */
export function buildSearchMatch(terms: string[], { wholeWords = false } = {}): string | null {
  // A quoted FTS5 phrase. With `*` its last word may continue: "pix gel"* matches "PIX GELLY".
  const phrase = (text: string) => `"${text.replaceAll('"', '""')}"${wholeWords ? '' : '*'}`
  const words = terms.filter((term) => /[\p{L}\p{N}]/u.test(term))
  const parts: string[] = []
  for (let i = 0; i < words.length; i++) {
    const word = words[i]!
    const next = words[i + 1]
    if (NUMBER.test(word) && next && UNITS.has(next.toLowerCase())) {
      parts.push(`(${phrase(`${word} ${next}`)} OR ${phrase(`${word}${next}`)})`)
      i++
      continue
    }
    const numberAndUnit = NUMBER_AND_UNIT.exec(word)
    if (numberAndUnit && UNITS.has(numberAndUnit[2]!.toLowerCase())) {
      parts.push(`(${phrase(word)} OR ${phrase(`${numberAndUnit[1]} ${numberAndUnit[2]}`)})`)
      continue
    }
    parts.push(phrase(word))
  }
  // An explicit AND: FTS5 accepts "a" "b" but not "a" ("b" OR "c").
  return parts.length ? parts.join(' AND ') : null
}
