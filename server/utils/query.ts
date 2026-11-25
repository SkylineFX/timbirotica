/**
 * One query parameter as a string. A repeated parameter (?a=1&a=2) arrives
 * as an array, and passing that to a query builder fails with a 500, so the
 * first value counts. Anything that isn't a string gives undefined.
 */
export function queryString(value: unknown): string | undefined {
  const first = Array.isArray(value) ? value[0] : value
  return typeof first === 'string' ? first : undefined
}

/** A number query parameter, or undefined when it is missing, empty or not finite (Infinity, NaN). */
export function queryNumber(value: unknown): number | undefined {
  const text = queryString(value)
  if (!text) return undefined
  const number = Number(text)
  return Number.isFinite(number) ? number : undefined
}
