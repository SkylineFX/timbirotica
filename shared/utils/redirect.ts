// Pages that would only send the visitor back to sign in, or start a sign-in.
const SIGN_IN_PAGES = /^\/(?:user\/(?:login|register)|auth\/)/

/**
 * The page to return to after signing in, taken from a `redirect` query value,
 * or null when it isn't a safe page of this shop.
 *
 * Only a path on this site is accepted. Everything that could leave the site
 * is refused: full URLs ("https://..."), protocol-relative ones ("//host"), and
 * backslashes or control characters, which browsers turn into "//host"
 * ("/\host", "/\t/host"). Without this check a crafted sign-in link could send
 * people to another site right after they sign in.
 */
export function safeRedirectPath(value: unknown): string | null {
  const path = Array.isArray(value) ? value[0] : value
  if (typeof path !== 'string' || path.length > 1000) return null
  if (!path.startsWith('/') || path.startsWith('//')) return null
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001F\u007F]/.test(path)) return null
  if (SIGN_IN_PAGES.test(path)) return null
  return path
}

/** Set one query parameter on a local path, keeping its other parameters and #hash. */
export function withQueryParam(path: string, key: string, value: string): string {
  const url = new URL(path, 'http://shop.local')
  url.searchParams.set(key, value)
  return url.pathname + url.search + url.hash
}
