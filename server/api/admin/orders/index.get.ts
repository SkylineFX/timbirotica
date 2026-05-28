import { and, asc, desc, eq, gte, like, lte, or, sql } from 'drizzle-orm'

const SORTABLE_COLUMNS = {
  createdAt: tables.orders.createdAt,
  total: tables.orders.total,
} as const

type SortKey = keyof typeof SORTABLE_COLUMNS

export default eventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, parseInt(String(query.page ?? '1')))
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '25'))))
  const offset = (page - 1) * limit
  const status = query.status ? String(query.status) : undefined
  const q = query.q ? String(query.q).trim() : ''

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
    q ? or(
      like(tables.orders.orderNumber, `%${q}%`),
      like(tables.orders.shippingAddressSnapshot, `%${q}%`),
      like(tables.orders.billingAddressSnapshot, `%${q}%`),
    ) : undefined,
    from ? gte(tables.orders.createdAt, from) : undefined,
    to ? lte(tables.orders.createdAt, to) : undefined,
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
        items: { with: { product: true } },
        user: {
          columns: { id: true, firstName: true, lastName: true, email: true, phone: true }
        }
      }
    }),
    db.select({ count: sql<number>`count(*)` })
      .from(tables.orders)
      .where(where ?? sql`1=1`)
  ])

  return {
    orders,
    total: totalRow[0]?.count ?? 0,
    page,
    limit,
  }
})
