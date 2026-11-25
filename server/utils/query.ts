/**
 * One query parameter as a string. A repeated parameter (?a=1&a=2) arrives
 * as an array, and passing that to a query builder fails with a 500, so the
 * first value counts. Anything that isn't a string gives undefined.
 */
export function queryString(value: unknown): string | undefined {
  const first = Array.isArray(value) ? value[0] : value
  return typeof first === 'string' ? first : undefined
}

/**
 * A whole-number query parameter such as a page or a page size, kept within
 * min and max. The fallback when it is missing or not a finite number, so a
 * bad value can never remove a LIMIT or produce an offset D1 refuses.
 */
export function queryInteger(value: unknown, { fallback, min, max }: { fallback: number, min: number, max: number }): number {
  const number = queryNumber(value)
  return number === undefined ? fallback : Math.min(Math.max(Math.floor(number), min), max)
}

/** A number query parameter, or undefined when it is missing, empty or not finite (Infinity, NaN). */
export function queryNumber(value: unknown): number | undefined {
  const text = queryString(value)
  if (!text) return undefined
  const number = Number(text)
  return Number.isFinite(number) ? number : undefined
}
