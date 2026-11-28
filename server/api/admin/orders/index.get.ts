import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm'

const SORTABLE_COLUMNS = {
  createdAt: tables.orders.createdAt,
  total: tables.orders.total
} as const

type SortKey = keyof typeof SORTABLE_COLUMNS

export default eventHandler(async (event) => {
  await requireAdminSession(event)

  const query = getQuery(event)
  const page = queryInteger(query.page, { fallback: 1, min: 1, max: 10_000 })
  const limit = queryInteger(query.limit, { fallback: 25, min: 1, max: 100 })
  const offset = (page - 1) * limit
  const status = queryString(query.status) || undefined
  const q = queryString(query.q)?.trim() ?? ''

  const sortByRaw = query.sortBy ? String(query.sortBy) : 'createdAt'
  const sortBy: SortKey = (sortByRaw in SORTABLE_COLUMNS ? sortByRaw : 'createdAt') as SortKey
  const sortDir = String(query.sortDir ?? 'desc') === 'asc' ? 'asc' : 'desc'

  const fromMs = query.from ? Date.parse(String(query.from)) : NaN
  const toMs = query.to ? Date.parse(String(query.to)) : NaN
  const from = isNaN(fromMs) ? undefined : new Date(fromMs)
  const to = isNaN(toMs) ? undefined : new Date(toMs)

  const db = useDrizzle()

  const filters = [
    status ? eq(tables.orders.status, status) : undefined,
    // Every word in the order number, an address or the customer's name or email.
    orderSearchFilter(q),
    from ? gte(tables.orders.createdAt, from) : undefined,
    to ? lte(tables.orders.createdAt, to) : undefined
  ].filter(Boolean) as ReturnType<typeof eq>[]

  const where = filters.length ? and(...filters) : undefined

  const sortColumn = SORTABLE_COLUMNS[sortBy]
  const orderBy = sortDir === 'asc' ? asc(sortColumn) : desc(sortColumn)

  const [orders, totalRow] = await Promise.all([
    db.query.orders.findMany({
      where,
      orderBy: [orderBy],
      limit,
      offset,
      with: {
        // The long product description isn't shown in the order list.
        items: { with: { product: { columns: { description: false } } } },
        user: {
          columns: { id: true, firstName: true, lastName: true, email: true, phone: true }
        }
      }
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(tables.orders)
      .where(where ?? sql`1=1`)
  ])

  return {
    orders,
    total: totalRow[0]?.count ?? 0,
    page,
    limit
  }
})
