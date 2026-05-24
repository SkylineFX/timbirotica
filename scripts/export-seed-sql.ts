/**
 * One-off seed exporter for production D1.
 *
 * Reads the local SQLite catalog (.data/db/sqlite.db) and emits `seed.sql`
 * containing INSERT statements for catalog + locality tables only:
 *   categories, brands, products, counties, cities
 *
 * Image paths (`/uploads/...`) are rewritten to absolute CDN URLs so the
 * production app serves images from R2 via cdn.timbirotica.ro.
 *
 * Users / orders / carts / favorites / tokens are intentionally NOT exported —
 * production starts with an empty customer dataset.
 *
 * Usage:
 *   npx tsx scripts/export-seed-sql.ts
 *   npx wrangler d1 import <DB_NAME> --remote --file=seed.sql   # recommended for large files
 *   # (or: npx wrangler d1 execute <DB_NAME> --remote --file=seed.sql)
 */
import { createClient } from '@libsql/client'
import { writeFile } from 'node:fs/promises'

const CDN_BASE = 'https://cdn.timbirotica.ro'

// Order matters: parents before children for FK sanity (categories self-ref + products ref both).
const TABLES = ['categories', 'brands', 'counties', 'cities', 'products'] as const

// Columns whose `/uploads/...` values must become absolute CDN URLs.
const IMAGE_COLUMNS: Record<string, string[]> = {
  categories: ['image'],
  brands: ['image'],
  products: ['images']
}

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

const rewriteImages = (val: string): string => val.replaceAll('/uploads/', `${CDN_BASE}/uploads/`)

async function main() {
  const out: string[] = ['PRAGMA foreign_keys=OFF;', 'BEGIN TRANSACTION;']
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

    const res = await client.execute(`SELECT * FROM "${table}"`)
    for (const row of res.rows) {
      const vals = cols.map(c => {
        let v = (row as Record<string, unknown>)[c]
        if (imgCols.has(c) && typeof v === 'string' && v) v = rewriteImages(v)
        return sqlValue(v)
      })
      out.push(`INSERT INTO "${table}" (${colList}) VALUES (${vals.join(', ')});`)
    }
    summary.push(`  ${table}: ${res.rows.length}`)
  }

  out.push('COMMIT;', 'PRAGMA foreign_keys=ON;', '')
  await writeFile('seed.sql', out.join('\n'))

  console.log('Wrote seed.sql')
  console.log(summary.join('\n'))
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => client.close())
