/**
 * The most subcategories, and the most brands, one product listing filters
 * on. Each value becomes a bound parameter, and D1 allows 100 per statement.
 * With both lists full, the product query binds about 50 values plus the
 * category and its subcategories (26 at most today), so it stays under the
 * limit while no category has more than about 45 subcategories.
 */
export const PRODUCT_FILTER_MAX_VALUES = 20

/**
 * Reads a comma-separated filter such as ?sub=a,b or ?b=x,y: trimmed, empty
 * and repeated values dropped, at most PRODUCT_FILTER_MAX_VALUES kept.
 */
export function parseFilterList(value: unknown): string[] {
  if (value === undefined || value === null || value === '') return []
  const values = String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return [...new Set(values)].slice(0, PRODUCT_FILTER_MAX_VALUES)
}
