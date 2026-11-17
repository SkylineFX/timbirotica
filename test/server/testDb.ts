import { createClient } from '@libsql/client'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import { sql } from 'drizzle-orm'
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from 'drizzle-kit/api'
import * as schema from '~~/server/db/schema'
import { splitIntoChunks } from '~~/shared/utils/chunk'

export type TestDb = LibSQLDatabase<typeof schema>

// libsql accepts far more bound parameters than D1, so a query that is too big
// for production still runs in these tests. Check the limit on the SQL instead.
export const D1_MAX_BOUND_PARAMETERS = 100

export const boundParameterCount = (query: unknown): number =>
  (query as { toSQL(): { params: unknown[] } }).toSQL().params.length

let createStatements: Promise<string[]> | undefined

/**
 * A fresh in-memory SQLite database built from server/db/schema.ts, with
 * foreign keys on as in D1.
 */
export async function createTestDb(): Promise<TestDb> {
  createStatements ??= (async () => generateSQLiteMigration(
    await generateSQLiteDrizzleJson({}),
    await generateSQLiteDrizzleJson(schema),
  ))()

  const db = drizzle(createClient({ url: ':memory:' }), { schema })
  await db.run(sql`PRAGMA foreign_keys = ON`)
  for (const statement of await createStatements) {
    await db.run(sql.raw(statement))
  }
  return db
}

export const TEST_USER_ID = 1
export const TEST_CART_ID = 1

/** Adds one user, an empty cart for that user, and products with ids 1..productCount. */
export async function seedUserCartAndProducts(db: TestDb, productCount: number): Promise<void> {
  const now = new Date()
  await db.insert(schema.users).values({
    id: TEST_USER_ID, firstName: 'Test', email: 'test@example.com', password: 'x', createdAt: now,
  })
  const products = Array.from({ length: productCount }, (_, i) => ({
    id: i + 1, name: `Produs ${i + 1}`, slug: `produs-${i + 1}`, price: 9.99, createdAt: now,
  }))
  for (const chunk of splitIntoChunks(products, 50)) {
    await db.insert(schema.products).values(chunk)
  }
  await db.insert(schema.carts).values({ id: TEST_CART_ID, userId: TEST_USER_ID, createdAt: now, updatedAt: now })
}
