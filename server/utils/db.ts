import { db } from 'hub:db'
import * as schema from '../db/schema'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'

export { sql, eq, and, or, inArray } from 'drizzle-orm'
export const tables = schema

export function useDrizzle() {
  return db as unknown as LibSQLDatabase<typeof schema>
}
