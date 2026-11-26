import { describe, it, expect, beforeEach } from 'vitest'
import { desc, eq, sql } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import { productSearchFilter, productSearchOrder } from '~~/server/utils/productSearch'
import { parseSearchTerms, buildSearchMatch } from '~~/shared/utils/search'
import {
  createTestDb,
  addSearchIndex,
  boundParameterCount,
  D1_MAX_BOUND_PARAMETERS,
  type TestDb
} from './testDb'

// Runs product search against an in-memory SQLite database built from
// server/db/schema.ts plus scripts/search-fts.sql, the same file that is applied
// to local, staging and production.

let db: TestDb

const PRODUCTS: Array<{ id: number; name: string; sku?: string }> = [
  { id: 1, name: 'PIX ALBASTRU', sku: 'K6' },
  { id: 2, name: 'SET 4 PIXURI CU GEL' },
  { id: 3, name: 'LAMINATOR A4 PIXEL FELLOWES' },
  { id: 4, name: 'CAIETE A4 60 FILE DICTANDO', sku: 'CAI-0460' },
  { id: 5, name: 'HÂRTIE COPIATOR A4 80G' },
  { id: 6, name: 'MARKER PERMANENT NEGRU 8576 CENTROPEN' },
  { id: 7, name: 'SET STILOU SI PIX XB POLY FLOW ALBASTRU TURCOAZ CU CUTIE CADOU' },
  { id: 8, name: 'SPIXEL ROSU' },
  { id: 9, name: 'PIX CU GEL 0.7MM NEGRU' },
  { id: 10, name: 'RIGLA PLASTIC 30 CM' },
  { id: 11, name: 'RIGLA METAL 30CM' },
  { id: 12, name: 'CREION MECANIC 0,7 MM' }
]

async function insertProducts(rows: typeof PRODUCTS) {
  // Higher ids are newer, so "newest first" and "most relevant" disagree.
  await db.insert(schema.products).values(
    rows.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku ?? null,
      slug: `p-${p.id}`,
      price: 10,
      createdAt: new Date(p.id * 1000)
    }))
  )
}

/** The listing's search query for typed text: the filter and the relevance order. */
function searchQuery(q: string) {
  const terms = parseSearchTerms(q)
  const match = buildSearchMatch(terms)
  const wholeWords = buildSearchMatch(terms, { wholeWords: true })
  if (!match || !wholeWords) return null
  return db
    .select({ id: schema.products.id })
    .from(schema.products)
    .where(productSearchFilter(match))
    .orderBy(
      ...productSearchOrder(match, wholeWords),
      desc(schema.products.createdAt),
      desc(schema.products.id)
    )
}

/** Ids found for a typed query, most relevant first, as the product listing sorts them. */
async function search(q: string): Promise<number[]> {
  const rows = (await searchQuery(q)) ?? []
  return rows.map((r) => r.id)
}

const sorted = (ids: number[]) => [...ids].sort((a, b) => a - b)

/** Throws if the index no longer agrees with the products table. */
const checkIndex = () =>
  db.run(sql`INSERT INTO products_fts(products_fts) VALUES ('integrity-check')`)

beforeEach(async () => {
  db = await createTestDb()
  await insertProducts(PRODUCTS)
  await addSearchIndex(db)
})

describe('product search matching', () => {
  it('matches the start of words, as the LIKE search did for singular to plural', async () => {
    expect(sorted(await search('pix'))).toEqual([1, 2, 3, 7, 9])
    expect(await search('caiet')).toEqual([4])
  })

  it('does not match inside a word', async () => {
    expect(await search('pix')).not.toContain(8)
    expect(await search('ixel')).toEqual([])
  })

  it('requires every word', async () => {
    expect(sorted(await search('pix albastru'))).toEqual([1, 7])
    expect(await search('pix rosu')).toEqual([])
  })

  it('finds a size however the number and unit are spaced', async () => {
    for (const q of ['0.7 mm', '0.7mm', '0,7mm', '0,7 MM']) {
      expect(sorted(await search(q)), q).toEqual([9, 12])
    }
    for (const q of ['30 cm', '30cm', 'rigla 30']) {
      expect(sorted(await search(q)), q).toEqual([10, 11])
    }
    expect(await search('hartie 80 g')).toEqual([5])
  })

  it('ignores case and diacritics on both sides', async () => {
    expect(await search('hartie')).toEqual([5])
    expect(await search('Hârtie copiator')).toEqual([5])
  })

  it('finds SKUs and numbers in names', async () => {
    expect(await search('cai-0460')).toEqual([4])
    expect(await search('k6')).toEqual([1])
    expect(await search('8576')).toEqual([6])
  })

  it('searches FTS5 operators and quotes as words', async () => {
    expect(await search('pix OR caiet')).toEqual([])
    expect(await search('pix" albastru')).toEqual(expect.arrayContaining([1, 7]))
    expect(await search('NEAR(pix albastru)')).toEqual([])
  })
})

describe('product search input', () => {
  // A MATCH expression that FTS5 rejects fails the whole listing with a 500.
  it('never builds a query that FTS5 rejects, whatever is typed', async () => {
    const typed = [
      '"',
      '""',
      '"pix',
      'pix"',
      '(',
      ')',
      '(pix',
      'pix)',
      '*',
      'pix*',
      '*pix',
      '^pix',
      'pix^',
      ':',
      'name:pix',
      '{name}: pix',
      '{name sku}:pix',
      '-pix',
      '+pix',
      'pix -gel',
      'AND',
      'OR',
      'NOT',
      'pix AND',
      'OR pix',
      'pix NOT gel',
      'NEAR',
      'NEAR(pix gel)',
      'NEAR/3',
      '0.7 mm',
      '0.7 mm mm',
      '80 g 80 g',
      '10ml"',
      '10"ml',
      '5 "mm',
      '1.2.3 cm',
      ',5 mm',
      '5, mm',
      '😀 pix',
      'ăîșțâ',
      'Ș',
      '\u0000',
      'pix\u0000gel',
      '%',
      '_',
      '%pix%',
      "pix'",
      "'; DROP TABLE products; --"
    ]
    const chars = [
      '"',
      '(',
      ')',
      '*',
      '^',
      ':',
      '-',
      '+',
      '{',
      '}',
      ' ',
      'a',
      'Z',
      '0',
      '7',
      '.',
      ',',
      'm',
      'ș'
    ]
    let seed = 1
    const random = () => (seed = (seed * 48271) % 2147483647) / 2147483647
    for (let i = 0; i < 300; i++) {
      typed.push(
        Array.from(
          { length: 1 + Math.floor(random() * 12) },
          () => chars[Math.floor(random() * chars.length)]
        ).join('')
      )
    }
    for (const q of typed) {
      await expect(search(q), JSON.stringify(q)).resolves.toBeInstanceOf(Array)
    }
  })
})

describe('product search ranking', () => {
  it('puts the closest match first, even when another product is newer', async () => {
    expect(await search('pix albastru')).toEqual([1, 7])
  })

  it('puts whole-word matches before words that only start the same', async () => {
    const ids = await search('pix')
    expect(sorted(ids.slice(0, 3))).toEqual([1, 7, 9]) // PIX ...
    expect(sorted(ids.slice(3))).toEqual([2, 3]) // PIXURI, PIXEL
  })

  it('works inside the listing query, which uses the relational query builder', async () => {
    const match = buildSearchMatch(['pix', 'albastru'])!
    const wholeWords = buildSearchMatch(['pix', 'albastru'], { wholeWords: true })!
    const products = await db.query.products.findMany({
      columns: { description: false },
      where: productSearchFilter(match),
      with: { brand: true, category: true },
      orderBy: (products, { desc }) => [
        ...productSearchOrder(match, wholeWords),
        desc(products.createdAt)
      ],
      limit: 1
    })
    expect(products.map((p) => p.id)).toEqual([1])
  })

  // A plan that looks the search up again for every product ("INDEX 0:=M",
  // a rowid lookup on products_fts) made "c" run for minutes on the full catalog.
  it('runs each full-text query once, not once per product', async () => {
    const { sql: text, params } = searchQuery('a4')!.toSQL()
    const plan = await db.$client.execute({
      sql: `EXPLAIN QUERY PLAN ${text}`,
      args: params as never[]
    })
    const details = plan.rows.map((r) => String(r.detail))
    expect(details.filter((d) => d.includes('products_fts VIRTUAL TABLE'))).toHaveLength(3)
    expect(details.filter((d) => /products_fts VIRTUAL TABLE INDEX \d+:=/.test(d))).toEqual([])
  })

  it('binds each search expression once per use, whatever the number of words', async () => {
    const query = searchQuery('a b c d e f g h i j k l m n')!
    expect(boundParameterCount(query)).toBe(3)
    expect(boundParameterCount(query)).toBeLessThanOrEqual(D1_MAX_BOUND_PARAMETERS)
  })
})

describe('search index upkeep', () => {
  it('indexes a new product', async () => {
    await insertProducts([{ id: 20, name: 'CAPSATOR METALIC' }])
    expect(await search('capsator')).toEqual([20])
    await checkIndex()
  })

  it('re-indexes a renamed product', async () => {
    await db
      .update(schema.products)
      .set({ name: 'CRETA COLORATA' })
      .where(eq(schema.products.id, 1))
    expect(await search('albastru')).toEqual([7])
    expect(await search('creta')).toEqual([1])
    await checkIndex()
  })

  it('keeps finding a product after price and stock updates', async () => {
    await db.update(schema.products).set({ price: 12.5, stock: 0 }).where(eq(schema.products.id, 1))
    expect(await search('k6')).toEqual([1])
    await checkIndex()
  })

  it('drops a deleted product', async () => {
    await db.delete(schema.products).where(eq(schema.products.id, 6))
    expect(await search('marker')).toEqual([])
    await checkIndex()
  })

  it('follows the upserts in sync.sql, which overwrite the sku', async () => {
    const upsert = (sku: string) =>
      db.run(
        sql.raw(
          `INSERT INTO "products" ("id", "name", "slug", "sku", "price", "created_at") VALUES (1, 'PIX ALBASTRU', 'p-1', '${sku}', 11, 1000)
       ON CONFLICT("id") DO UPDATE SET "price" = excluded."price", "sku" = excluded."sku"`
        )
      )
    await upsert('K6')
    await upsert('K7-NOU')
    expect(await search('k7-nou')).toEqual([1])
    expect(await search('k6')).toEqual([])
    await checkIndex()
  })

  it('can be applied again without harm', async () => {
    await addSearchIndex(db)
    expect(sorted(await search('pix'))).toEqual([1, 2, 3, 7, 9])
    await checkIndex()
  })
})
