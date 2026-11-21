/**
 * Creates or rebuilds the product search index (scripts/search-fts.sql) in the
 * local database. Run it once after cloning, and again after `npm run db:push`
 * changes the products table. Staging and production get the same file through
 * `wrangler d1 execute` (see the header of search-fts.sql).
 *
 * Usage (from the project root):
 *   npm run db:fts
 */
import { createClient } from '@libsql/client'
import { readFile } from 'node:fs/promises'

const client = createClient({ url: 'file:.data/db/sqlite.db' })

await client.executeMultiple(await readFile('scripts/search-fts.sql', 'utf8'))
const [products, indexed] = await Promise.all([
  client.execute('SELECT count(*) AS n FROM products'),
  client.execute(`SELECT count(*) AS n FROM products_fts_docsize`)
])
console.log(`Search index rebuilt: ${indexed.rows[0]!.n} of ${products.rows[0]!.n} products indexed.`)
client.close()
