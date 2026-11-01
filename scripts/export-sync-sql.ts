/**
 * Incremental sync exporter for production D1.
 *
 * Unlike export-seed-sql.ts (a one-off seed with plain INSERTs that fails on an
 * already-populated database), this emits idempotent UPSERTs so it can be run
 * after every catalog update:
 *
 *   - categories, brands: new rows are inserted, existing rows untouched
 *   - counties, cities: skipped by default (already seeded, static); pass
 *       `--include-localities` if you ever need to re-sync them
 *   - products: new rows are inserted; existing rows (matched by id) get
 *       price, stock, and sku overwritten with local values, and images filled
 *       in only when production has none. Name, slug, description, etc. are left alone.
 *
 * Image paths (`/uploads/...`) are rewritten to absolute CDN URLs (R2 via cdn.timbirotica.ro).
 * Upload new images to R2 BEFORE applying this file, or new products will show broken images.
 *
 * Users / orders / carts / favorites / tokens are never touched.
 *
 * Usage (from the project root):
 *   npx tsx scripts/export-sync-sql.ts
 *   npx wrangler d1 execute timbirotica-prod --remote --file=sync.sql
 */
import { createClient } from '@libsql/client'
import { writeFile } from 'node:fs/promises'

const CDN_BASE = 'https://cdn.timbirotica.ro'
const OUT_FILE = 'sync.sql'
const includeLocalities = process.argv.includes('--include-localities')

// Order matters: parents before children for FK sanity.
const TABLES = includeLocalities
  ? (['categories', 'brands', 'counties', 'cities', 'products'] as const)
  : (['categories', 'brands', 'products'] as const)

// Columns whose `/uploads/...` values must become absolute CDN URLs.
const IMAGE_COLUMNS: Record<string, string[]> = {
  categories: ['image'],
  brands: ['image'],
  products: ['images']
}

// categories self-references parent_id, so parents (lower id) must be inserted first.
const ORDER_BY: Record<string, string> = {
  categories: 'ORDER BY id',
  products: 'ORDER BY id'
}

// Conflict handling per table (keyed on the primary key `id`).
const ON_CONFLICT: Record<string, string> = {
  products: `ON CONFLICT("id") DO UPDATE SET
    "price" = excluded."price",
    "stock" = excluded."stock",
    "sku" = excluded."sku",
    "images" = CASE WHEN "products"."images" IS NULL OR "products"."images" = '[]'
                    THEN excluded."images" ELSE "products"."images" END`
}
const DEFAULT_ON_CONFLICT = 'ON CONFLICT("id") DO NOTHING'

const client = createClient({ url: 'file:.data/db/sqlite.db' })

function sqlValue(v: unknown): string {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL'
  if (typeof v === 'bigint') return v.toString()
  if (v instanceof Uint8Array) {
    let hex = ''
    for (const b of v) hex += b.toString(16).padStart(2, '0')
    return `X'${hex}'`
  }
  return `'${String(v).replace(/'/g, "''")}'`
}

// Only rewrite relative paths; leave values that are already absolute CDN URLs alone.
const rewriteImages = (val: string): string =>
  val.replace(/(^|[^a-zA-Z0-9.:])\/uploads\//g, `$1${CDN_BASE}/uploads/`)

async function main() {
  // No BEGIN/COMMIT or PRAGMA: D1 wraps file execution in its own transaction and
  // rejects explicit transaction statements.
  const out: string[] = []
  const summary: string[] = []

  for (const table of TABLES) {
    const info = await client.execute(`PRAGMA table_info("${table}")`)
    const cols = info.rows.map(r => String(r.name))
    if (cols.length === 0) {
      console.warn(`! table "${table}" not found — skipping`)
      continue
    }
    const imgCols = new Set(IMAGE_COLUMNS[table] ?? [])
    const colList = cols.map(c => `"${c}"`).join(', ')
    const conflict = (ON_CONFLICT[table] ?? DEFAULT_ON_CONFLICT).replace(/\s+/g, ' ')

    const res = await client.execute(`SELECT * FROM "${table}" ${ORDER_BY[table] ?? ''}`.trim())
    for (const row of res.rows) {
      const vals = cols.map(c => {
        let v = (row as Record<string, unknown>)[c]
        if (imgCols.has(c) && typeof v === 'string' && v) v = rewriteImages(v)
        return sqlValue(v)
      })
      out.push(`INSERT INTO "${table}" (${colList}) VALUES (${vals.join(', ')}) ${conflict};`)
    }
    summary.push(`  ${table}: ${res.rows.length}`)
  }

  out.push('')
  await writeFile(OUT_FILE, out.join('\n'))

  console.log(`Wrote ${OUT_FILE} (upserts)`)
  console.log(summary.join('\n'))
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => client.close())

