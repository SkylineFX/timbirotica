import { and, getTableName, or, sql, type SQL } from 'drizzle-orm'
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core'
import * as schema from '../db/schema'

// The admin order search (GET /api/admin/orders?q=...). Orders have no
// full-text index, so each word is a LIKE search, and D1 refuses a LIKE
// pattern longer than 50 bytes ("LIKE or GLOB pattern too complex").

export const LIKE_PATTERN_MAX_BYTES = 50
export const ORDER_SEARCH_MAX_WORDS = 5

const utf8Bytes = (text: string) => new TextEncoder().encode(text).length

/** A word escaped for LIKE ... ESCAPE '\', so % and _ match themselves instead of anything. */
export const escapeLike = (word: string): string => word.replace(/[\\%_]/g, (char) => `\\${char}`)

/**
 * The "%word%" patterns for a typed search: its first 5 words, each escaped
 * and shortened until the pattern fits D1's 50-byte limit.
 */
export function likeSearchPatterns(q: string): string[] {
  return q
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, ORDER_SEARCH_MAX_WORDS)
    .map((word) => {
      let chars = Array.from(word)
      const pattern = () => `%${escapeLike(chars.join(''))}%`
      while (utf8Bytes(pattern()) > LIKE_PATTERN_MAX_BYTES) chars = chars.slice(0, -1)
      return pattern()
    })
}

const likeEscaped = (column: SQLiteColumn | SQL, pattern: string): SQL =>
  sql`${column} like ${pattern} escape '\\'`

// The relational query builder (db.query.orders.findMany) prefixes every column
// object in `where` with the orders table, which would turn users.first_name
// into orders.first_name. The subquery names the users columns as identifiers.
const usersColumn = (column: SQLiteColumn): SQL =>
  sql`${sql.identifier(getTableName(schema.users))}.${sql.identifier(column.name)}`

/**
 * Orders matching every word of a search, each word in the order number, the
 * delivery or billing snapshot, or the customer's first name, last name or
 * email. "Ion Popescu" finds Ion Popescu's orders although the snapshots store
 * the two names apart. Undefined when the search has no words.
 */
export function orderSearchFilter(q: string): SQL | undefined {
  const patterns = likeSearchPatterns(q)
  if (!patterns.length) return undefined
  const { orders, users } = schema
  return and(
    ...patterns.map((pattern) =>
      or(
        likeEscaped(orders.orderNumber, pattern),
        likeEscaped(orders.shippingAddressSnapshot, pattern),
        likeEscaped(orders.billingAddressSnapshot, pattern),
        sql`${orders.userId} in (select ${usersColumn(users.id)} from ${sql.identifier(getTableName(users))} where ${or(
          likeEscaped(usersColumn(users.firstName), pattern),
          likeEscaped(usersColumn(users.lastName), pattern),
          likeEscaped(usersColumn(users.email), pattern)
        )})`
      )
    )
  )
}
