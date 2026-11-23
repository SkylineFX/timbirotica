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

/** An absolute URL for an image: product images are CDN URLs or /uploads paths. */
export function absoluteUrl(siteUrl: string, url: string): string {
  if (/^https?:\/\//.test(url)) return url
  return `${siteUrl.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`
}

export interface StructuredDataProduct {
  name: string
  sku?: string | null
  description?: string | null
  images?: string[] | null
  price: number
  stock: number
  brand?: { name: string } | null
}

/**
 * schema.org Product data for a product page, which Google reads to show the
 * price and availability in its results. Prices include VAT, in lei.
 */
export function productStructuredData(product: StructuredDataProduct, { url, siteUrl }: { url: string, siteUrl: string }) {
  const images = (product.images ?? []).map(image => absoluteUrl(siteUrl, image))
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.description ? { description: product.description } : {}),
    ...(images.length ? { image: images } : {}),
    ...(product.brand?.name ? { brand: { '@type': 'Brand', name: product.brand.name } } : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'RON',
      price: product.price.toFixed(2),
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition'
    }
  }
}

/**
 * The text of a <script type="application/ld+json">. "<" is escaped, so a
 * product name or description can't end the script tag early.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
