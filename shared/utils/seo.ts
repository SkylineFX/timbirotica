/**
 * A page's canonical address: the site URL and the path, keeping only `page`
 * from the query (when it is above 1). Filters, sort order and page size show
 * the same products under many URLs, so search engines should count them as
 * one page. Each page of a listing stays its own page.
 */
export function canonicalUrl(siteUrl: string, path: string, query: Record<string, unknown> = {}): string {
  const origin = siteUrl.replace(/\/+$/, '')
  const cleanPath = path.replace(/\/+$/, '') || '/'
  const page = Number(query.page)
  const pageQuery = Number.isInteger(page) && page > 1 ? `?page=${page}` : ''
  return `${origin}${cleanPath}${pageQuery}`
}
