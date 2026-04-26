import { asc } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const db = useDrizzle()
  return await db.query.counties.findMany({
    orderBy: [asc(tables.counties.name)]
  })
})
