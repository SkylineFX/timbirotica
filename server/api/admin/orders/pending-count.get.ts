import { eq, sql } from 'drizzle-orm'

export default eventHandler(async () => {
  const db = useDrizzle()
  const [row] = await db.select({ count: sql<number>`count(*)` })
    .from(tables.orders)
    .where(eq(tables.orders.status, 'processing'))
  return { count: row?.count ?? 0 }
})
