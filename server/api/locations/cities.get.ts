import { eq, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const countyName = query.countyName as string

  if (!countyName) {
    return []
  }

  const db = useDrizzle()

  // Find the county by name first
  const county = await db.query.counties.findFirst({
    where: eq(tables.counties.name, countyName)
  })

  if (!county) {
    return []
  }

  return await db.query.cities.findMany({
    where: eq(tables.cities.countyId, county.id),
    orderBy: [asc(tables.cities.name)]
  })
})
