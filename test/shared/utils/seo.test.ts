import { describe, it, expect } from 'vitest'
import { canonicalUrl } from '~~/shared/utils/seo'

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
