import { describe, it, expect, beforeAll } from 'vitest'
import * as schema from '~~/server/db/schema'
import {
  escapeLike,
  likeSearchPatterns,
  LIKE_PATTERN_MAX_BYTES,
  orderSearchFilter
} from '~~/server/utils/orderSearch'
import { createTestDb, type TestDb } from './testDb'

const bytes = (text: string) => new TextEncoder().encode(text).length

describe('likeSearchPatterns', () => {
  it('makes one "%word%" pattern per word, at most 5', () => {
    expect(likeSearchPatterns('  Ion   Popescu ')).toEqual(['%Ion%', '%Popescu%'])
    expect(likeSearchPatterns('a b c d e f g')).toHaveLength(5)
    expect(likeSearchPatterns('   ')).toEqual([])
  })

  it('escapes the LIKE wildcards and the escape character', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\')
    expect(likeSearchPatterns('%')).toEqual(['%\\%%'])
  })

  it("keeps every pattern within D1's 50-byte limit, diacritics and escapes included", () => {
    for (const word of [
      'x'.repeat(200),
      'ă'.repeat(60),
      '%'.repeat(60),
      'BANCA COMERCIALA ROMANA S.A. - SUCURSALA SECTOR 6'.replaceAll(' ', '')
    ]) {
      const [pattern] = likeSearchPatterns(word)
      expect(bytes(pattern!)).toBeLessThanOrEqual(LIKE_PATTERN_MAX_BYTES)
      expect(pattern!.endsWith('\\%')).toBe(false) // no cut inside an escape
    }
  })
})

describe('orderSearchFilter', () => {
  let db: TestDb
  // The same two queries as GET /api/admin/orders: the relational list (which
  // re-qualifies column objects in `where`) and the plain count.
  const find = async (q: string) => {
    const where = orderSearchFilter(q)
    const listed = (
      await db.query.orders.findMany({ where, with: { user: { columns: { id: true } } } })
    )
      .map((o) => o.orderNumber)
      .sort()
    const counted = await db
      .select({ number: schema.orders.orderNumber })
      .from(schema.orders)
      .where(where)
    expect(counted).toHaveLength(listed.length)
    return listed
  }

  beforeAll(async () => {
    db = await createTestDb()
    const now = new Date()
    await db.insert(schema.users).values([
      {
        id: 1,
        firstName: 'Ion',
        lastName: 'Popescu',
        email: 'ion.popescu@example.com',
        password: 'x',
        createdAt: now
      },
      {
        id: 2,
        firstName: 'Ana',
        lastName: 'Ionescu',
        email: 'ana@firma.ro',
        password: 'x',
        createdAt: now
      }
    ])
    await db.insert(schema.orders).values([
      // Snapshots store the names apart, as the order endpoint does.
      {
        userId: 1,
        orderNumber: 'A1B2C3D4',
        total: 10,
        shippingAddressSnapshot: JSON.stringify({
          firstName: 'Ion',
          lastName: 'Popescu',
          street: 'Bl: A1, Sc: 2'
        }),
        createdAt: now
      },
      // A pickup order for a company: no delivery address at all.
      {
        userId: 1,
        orderNumber: 'E5F6A7B8',
        total: 20,
        shippingAddressSnapshot: '{}',
        billingAddressSnapshot: JSON.stringify({ companyName: 'Firma SRL' }),
        createdAt: now
      },
      {
        userId: 2,
        orderNumber: 'C9D0E1F2',
        total: 30,
        shippingAddressSnapshot: JSON.stringify({
          firstName: 'Ana',
          lastName: 'Ionescu',
          street: 'Strada 50%'
        }),
        createdAt: now
      }
    ])
  })

  it('finds a customer by full name, also on orders whose snapshots lack it', async () => {
    expect(await find('Ion Popescu')).toEqual(['A1B2C3D4', 'E5F6A7B8'])
  })

  it('finds by email, order number, company and street', async () => {
    expect(await find('ana@firma.ro')).toEqual(['C9D0E1F2'])
    expect(await find('e5f6')).toEqual(['E5F6A7B8'])
    expect(await find('Firma')).toEqual(['C9D0E1F2', 'E5F6A7B8'])
    expect(await find('Bl: A1')).toEqual(['A1B2C3D4'])
  })

  it('needs every word to match', async () => {
    expect(await find('Popescu Ana')).toEqual([])
  })

  it('searches % and _ as text, not as wildcards', async () => {
    expect(await find('%')).toEqual(['C9D0E1F2'])
    expect(await find('_')).toEqual([])
  })

  it('adds no condition for an empty search', () => {
    expect(orderSearchFilter('  ')).toBeUndefined()
  })
})
