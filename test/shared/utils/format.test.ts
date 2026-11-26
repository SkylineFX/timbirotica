import { describe, it, expect } from 'vitest'
import {
  formatAmount,
  formatRon,
  formatShopDate,
  formatShopDateTime,
  formatShopLongDate
} from '~~/shared/utils/format'

// 00:30 on 17 November in Romania (UTC+2) is still 16 November in UTC.
const JUST_AFTER_MIDNIGHT_WINTER = new Date('2026-11-16T22:30:00Z')
// 00:30 on 16 July in Romania (summer time, UTC+3) is still 15 July in UTC.
const JUST_AFTER_MIDNIGHT_SUMMER = new Date('2026-07-15T21:30:00Z')

describe('test environment', () => {
  it('runs in UTC, like Cloudflare Workers', () => {
    expect(JUST_AFTER_MIDNIGHT_WINTER.getDate()).toBe(16)
  })
})

describe('formatShopDate', () => {
  it('uses the Romanian date, not the UTC date', () => {
    expect(formatShopDate(JUST_AFTER_MIDNIGHT_WINTER)).toBe('17.11.2026')
    expect(formatShopDate(JUST_AFTER_MIDNIGHT_SUMMER)).toBe('16.07.2026')
  })

  it('accepts an ISO string', () => {
    expect(formatShopDate('2026-11-16T22:30:00.000Z')).toBe('17.11.2026')
  })
})

describe('formatShopLongDate', () => {
  it('uses the Romanian date, with the month named', () => {
    expect(formatShopLongDate(JUST_AFTER_MIDNIGHT_WINTER)).toBe('17 noiembrie 2026')
    expect(formatShopLongDate(JUST_AFTER_MIDNIGHT_SUMMER)).toBe('16 iulie 2026')
  })
})

describe('formatShopDateTime', () => {
  it('uses the Romanian date and time', () => {
    const text = formatShopDateTime(JUST_AFTER_MIDNIGHT_WINTER)
    expect(text).toContain('17')
    expect(text).toContain('00:30')
  })

  it('follows summer time', () => {
    expect(formatShopDateTime(JUST_AFTER_MIDNIGHT_SUMMER)).toContain('00:30')
  })
})

describe('formatAmount and formatRon', () => {
  it('always shows two decimals with Romanian separators', () => {
    expect(formatAmount(12.5)).toBe('12,50')
    expect(formatAmount(0)).toBe('0,00')
    expect(formatAmount(1199.4)).toBe('1.199,40')
  })

  it('rounds away floating-point noise', () => {
    expect(formatAmount(0.1 * 3)).toBe('0,30')
    expect(formatAmount(5737.4399999999987)).toBe('5.737,44')
  })

  it('adds the currency', () => {
    expect(formatRon(12.5)).toBe('12,50 RON')
  })
})
