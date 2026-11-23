import { describe, it, expect } from 'vitest'
import { canonicalUrl, absoluteUrl, productStructuredData, jsonLd } from '~~/shared/utils/seo'

const SITE = 'https://timbirotica.ro'

describe('canonicalUrl', () => {
  it('joins the site URL and the path', () => {
    expect(canonicalUrl(SITE, '/c/pixuri')).toBe('https://timbirotica.ro/c/pixuri')
    expect(canonicalUrl(SITE, '/')).toBe('https://timbirotica.ro/')
  })

  it('drops trailing slashes from the site URL and the path', () => {
    expect(canonicalUrl(`${SITE}/`, '/producatori/')).toBe('https://timbirotica.ro/producatori')
    expect(canonicalUrl(`${SITE}/`, '/')).toBe('https://timbirotica.ro/')
  })

  it('drops filters, sort order and page size', () => {
    const query = { sub: ['pixuri', 'markere'], b: 'faber-castell', sort: 'price-asc', limit: '48', minPrice: '5', available: '1' }
    expect(canonicalUrl(SITE, '/c/instrumente-de-scris', query)).toBe('https://timbirotica.ro/c/instrumente-de-scris')
  })

  it('keeps the page number above 1', () => {
    expect(canonicalUrl(SITE, '/c/pixuri', { page: '3', sort: 'price-asc' })).toBe('https://timbirotica.ro/c/pixuri?page=3')
  })

  it('leaves out page 1 and page numbers that are not whole numbers above 1', () => {
    for (const page of ['1', '0', '-2', '2.5', 'abc', '', undefined, ['2', '3']]) {
      expect(canonicalUrl(SITE, '/c/pixuri', { page })).toBe('https://timbirotica.ro/c/pixuri')
    }
  })
})

describe('absoluteUrl', () => {
  it('keeps absolute URLs', () => {
    expect(absoluteUrl(SITE, 'https://cdn.timbirotica.ro/uploads/products/a.jpg')).toBe('https://cdn.timbirotica.ro/uploads/products/a.jpg')
  })

  it('puts the site URL in front of a path, with one slash', () => {
    expect(absoluteUrl(`${SITE}/`, '/uploads/products/a.jpg')).toBe('https://timbirotica.ro/uploads/products/a.jpg')
    expect(absoluteUrl(SITE, 'uploads/products/a.jpg')).toBe('https://timbirotica.ro/uploads/products/a.jpg')
  })
})

describe('productStructuredData', () => {
  const url = 'https://timbirotica.ro/c/pixuri/pix-albastru'
  const product = {
    name: 'Pix albastru',
    sku: 'SH000001',
    description: 'Pix cu bila.',
    images: ['https://cdn.timbirotica.ro/a.jpg', '/uploads/products/b.jpg'],
    price: 2.5,
    stock: 3,
    brand: { name: 'Schneider' }
  }

  it('describes the product and its offer', () => {
    expect(productStructuredData(product, { url, siteUrl: SITE })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Pix albastru',
      sku: 'SH000001',
      description: 'Pix cu bila.',
      image: ['https://cdn.timbirotica.ro/a.jpg', 'https://timbirotica.ro/uploads/products/b.jpg'],
      brand: { '@type': 'Brand', name: 'Schneider' },
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: 'RON',
        price: '2.50',
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition'
      }
    })
  })

  it('marks a product with no stock as out of stock', () => {
    expect(productStructuredData({ ...product, stock: 0 }, { url, siteUrl: SITE }).offers.availability).toBe('https://schema.org/OutOfStock')
  })

  it('leaves out the fields a product does not have', () => {
    const data = productStructuredData({ name: 'Caiet', price: 4, stock: 1, sku: null, description: '', images: [], brand: null }, { url, siteUrl: SITE })
    expect(Object.keys(data)).toEqual(['@context', '@type', 'name', 'offers'])
  })
})

describe('jsonLd', () => {
  it('escapes "<" so the text cannot close the script tag', () => {
    const text = jsonLd({ name: 'Pix </script><script>alert(1)</script>' })
    expect(text).not.toContain('<')
    expect(JSON.parse(text)).toEqual({ name: 'Pix </script><script>alert(1)</script>' })
  })
})

