import { and, asc, eq, like, or, sql } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, parseInt(String(query.page ?? '1')))
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '25'))))
  const offset = (page - 1) * limit
  const q = query.q ? String(query.q).trim() : ''
  const categoryId = query.categoryId ? parseInt(String(query.categoryId)) : undefined

  const db = useDrizzle()

  const filters = [
    q ? or(
      like(tables.products.name, `%${q}%`),
      like(tables.products.sku, `%${q}%`),
    ) : undefined,
    categoryId && !isNaN(categoryId) ? eq(tables.products.categoryId, categoryId) : undefined,
  ].filter(Boolean) as ReturnType<typeof eq>[]

  const where = filters.length ? and(...filters) : undefined

  const [products, totalRow] = await Promise.all([
    db.query.products.findMany({
      where,
      orderBy: [asc(tables.products.name)],
      limit,
      offset,
      with: {
        category: { columns: { id: true, name: true, slug: true } },
        brand: { columns: { id: true, name: true } },
      }
    }),
    db.select({ count: sql<number>`count(*)` })
      .from(tables.products)
      .where(where ?? sql`1=1`)
  ])

  return {
    products,
    total: totalRow[0]?.count ?? 0,
    page,
    limit,
  }
})
