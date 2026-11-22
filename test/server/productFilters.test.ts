import { describe, it, expect } from 'vitest'
import { parseFilterList, PRODUCT_FILTER_MAX_VALUES } from '~~/server/utils/productFilters'

describe('parseFilterList', () => {
  it('splits, trims and drops empty and repeated values', () => {
    expect(parseFilterList(' caiete, pixuri,,caiete ,')).toEqual(['caiete', 'pixuri'])
  })

  it('returns nothing for a missing or empty filter', () => {
    expect(parseFilterList(undefined)).toEqual([])
    expect(parseFilterList('')).toEqual([])
    expect(parseFilterList(' , ')).toEqual([])
  })

  it(`keeps at most ${PRODUCT_FILTER_MAX_VALUES} values, whatever the URL holds`, () => {
    const many = Array.from({ length: 500 }, (_, i) => `brand-${i}`).join(',')
    const values = parseFilterList(many)
    expect(values).toHaveLength(PRODUCT_FILTER_MAX_VALUES)
    expect(values[0]).toBe('brand-0')
  })

  it('reads a repeated query parameter as one list', () => {
    // ?b=a&b=b arrives as an array, which String() joins with commas.
    expect(parseFilterList(['adel', 'leitz'])).toEqual(['adel', 'leitz'])
  })
})
