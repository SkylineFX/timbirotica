import { asc, desc, sql, type SQL } from 'drizzle-orm'
import * as schema from '../db/schema'

// Product search looks words up in the products_fts index (scripts/search-fts.sql)
// instead of scanning every product with LIKE. The MATCH expressions come from
// buildSearchMatch (shared/utils/search.ts) and each is sent as one bound
// parameter, so a search adds one parameter per use to a statement.

/** Keeps the products whose name or SKU matches the search. */
export const productSearchFilter = (match: string): SQL =>
  sql`${schema.products.id} IN (SELECT rowid FROM products_fts WHERE products_fts MATCH ${match})`

/**
 * Most relevant first, for rows that productSearchFilter kept. Products where
 * every word appears whole come first, so "pix" lists "PIX K15" before
 * "LAMINATOR PIXEL"; within each group, FTS5's BM25 score decides.
 *
 * Both lists come from one full-text query each, which SQLite runs once and
 * keeps in a temporary index. `LIMIT -1` stops SQLite from merging the score
 * query into the outer one, which would run the full-text query again for
 * every product: "a4" then took 60 ms instead of 1 ms, and "c" did not finish
 * in 2 minutes.
 */
export const productSearchOrder = (match: string, wholeWordsMatch: string): SQL[] => [
  desc(
    sql`${schema.products.id} IN (SELECT rowid FROM products_fts WHERE products_fts MATCH ${wholeWordsMatch})`
  ),
  asc(
    sql`(SELECT r.rank FROM (SELECT rowid AS id, rank FROM products_fts WHERE products_fts MATCH ${match} LIMIT -1) AS r WHERE r.id = ${schema.products.id})`
  )
]
