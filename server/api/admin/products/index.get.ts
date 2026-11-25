import { and, asc, eq, sql } from 'drizzle-orm'
import { buildSearchMatch, isSearchLongEnough, parseSearchTerms } from '~~/shared/utils/search'

export default eventHandler(async (event) => {
  await requireAdminSession(event)

  const query = getQuery(event)
  const page = queryInteger(query.page, { fallback: 1, min: 1, max: 10_000 })
  const limit = queryInteger(query.limit, { fallback: 25, min: 1, max: 100 })
  const offset = (page - 1) * limit
  const q = queryString(query.q)?.trim() ?? ''
  const categoryId = queryInteger(query.categoryId, { fallback: 0, min: 0, max: Number.MAX_SAFE_INTEGER })

  // The shop's full-text search (products_fts), with its 2-character minimum:
  // diacritics and word order don't matter, and a pasted product name works.
  let searchFilter: ReturnType<typeof productSearchFilter> | undefined
  if (q) {
    const match = isSearchLongEnough(q) ? buildSearchMatch(parseSearchTerms(q)) : null
    if (!match) return { products: [], total: 0, page, limit }
    searchFilter = productSearchFilter(match)
  }

  const db = useDrizzle()

  const filters = [
    searchFilter,
    categoryId ? eq(tables.products.categoryId, categoryId) : undefined,
  ].filter(Boolean) as ReturnType<typeof eq>[]

  const where = filters.length ? and(...filters) : undefined

  const [products, totalRow] = await Promise.all([
    db.query.products.findMany({
      // The long description isn't shown in the admin list.
      columns: { description: false },
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
