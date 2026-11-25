import { describe, it, expect } from 'vitest'
import { queryNumber, queryString } from '~~/server/utils/query'

describe('queryString', () => {
  it('passes a single value through', () => {
    expect(queryString('pixuri')).toBe('pixuri')
    expect(queryString('')).toBe('')
  })

  it('takes the first value of a repeated parameter', () => {
    expect(queryString(['pixuri', 'caiete'])).toBe('pixuri')
  })

  it('gives undefined for anything else', () => {
    expect(queryString(undefined)).toBeUndefined()
    expect(queryString([])).toBeUndefined()
    expect(queryString(5)).toBeUndefined()
  })
})

describe('queryNumber', () => {
  it('reads finite numbers', () => {
    expect(queryNumber('12.5')).toBe(12.5)
    expect(queryNumber(['3', '4'])).toBe(3)
    expect(queryNumber('1e20')).toBe(1e20)
  })

  it('gives undefined for missing, empty and non-finite values', () => {
    expect(queryNumber(undefined)).toBeUndefined()
    expect(queryNumber('')).toBeUndefined()
    expect(queryNumber('abc')).toBeUndefined()
    expect(queryNumber('Infinity')).toBeUndefined()
    expect(queryNumber('-Infinity')).toBeUndefined()
  })
})
