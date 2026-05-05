import { inArray, like, and, or, eq, gte, lte, gt, sql, desc } from "drizzle-orm"

export default eventHandler(async (event) => {
  const query = getQuery(event)
  const categorySlug = query.category as string | undefined
  const brandSlug = query.brand as string | undefined
  const searchQ = query.q as string | undefined

  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 12
  const offset = (page - 1) * limit

  const minPrice = query.minPrice ? Number(query.minPrice) : undefined
  const maxPrice = query.maxPrice ? Number(query.maxPrice) : undefined
  const onlyAvailable = query.available === '1'
  const subSlugs = query.sub
    ? String(query.sub).split(',').map(s => s.trim()).filter(Boolean)
    : []
  const brandFilterSlugs = query.b
    ? String(query.b).split(',').map(s => s.trim()).filter(Boolean)
    : []

  const db = useDrizzle()

  const emptyResponse = {
    products: [] as any[],
    total: 0,
    page,
    limit,
    facets: { price: null, brands: null, subcategories: null }
  }

  let scopeCategory: { id: number; name: string; slug: string; parentId: number | null } | null = null
  let scopeCategoryIds: number[] = []
  if (categorySlug) {
    const category = await db.query.categories.findFirst({
      where: eq(tables.categories.slug, categorySlug)
    })
    if (!category) return emptyResponse
    scopeCategory = category
    const subcategories = await db.query.categories.findMany({
      where: eq(tables.categories.parentId, category.id)
    })
    scopeCategoryIds = [category.id, ...subcategories.map(c => c.id)]
  }

  let scopeBrand: { id: number; slug: string; name: string } | null = null
  if (brandSlug) {
    const brand = await db.query.brands.findFirst({
      where: eq(tables.brands.slug, brandSlug)
    })
    if (!brand) return emptyResponse
    scopeBrand = { id: brand.id, slug: brand.slug, name: brand.name }
  }

  const scopeConditions = []
  if (query.recommended === 'true') scopeConditions.push(eq(tables.products.isRecommended, true))
  if (scopeCategoryIds.length) scopeConditions.push(inArray(tables.products.categoryId, scopeCategoryIds))
  if (scopeBrand) scopeConditions.push(eq(tables.products.brandId, scopeBrand.id))
  if (searchQ) {
    const searchTerms = searchQ.trim().split(/\s+/)
    if (searchTerms.length > 0) {
      const termConditions = searchTerms.map(term => or(
        like(tables.products.name, `%${term}%`),
        like(tables.products.sku, `%${term}%`)
      ))
      scopeConditions.push(and(...termConditions))
    }
  }
  const scopeWhere = scopeConditions.length ? and(...scopeConditions) : undefined

  const [selectedSubs, selectedBrands] = await Promise.all([
    subSlugs.length && scopeCategory
      ? db.query.categories.findMany({
          where: and(
            inArray(tables.categories.slug, subSlugs),
            eq(tables.categories.parentId, scopeCategory.id)
          )
        })
      : Promise.resolve([] as Array<{ id: number }>),
    brandFilterSlugs.length && !scopeBrand
      ? db.query.brands.findMany({
          where: inArray(tables.brands.slug, brandFilterSlugs)
        })
      : Promise.resolve([] as Array<{ id: number }>)
  ])

  const filterConditions = [...scopeConditions]
  if (minPrice !== undefined && !isNaN(minPrice)) filterConditions.push(gte(tables.products.price, minPrice))
  if (maxPrice !== undefined && !isNaN(maxPrice)) filterConditions.push(lte(tables.products.price, maxPrice))
  if (onlyAvailable) filterConditions.push(gt(tables.products.stock, 0))
  if (selectedSubs.length) filterConditions.push(inArray(tables.products.categoryId, selectedSubs.map(s => s.id)))
  if (selectedBrands.length) filterConditions.push(inArray(tables.products.brandId, selectedBrands.map(b => b.id)))
  const fullWhere = filterConditions.length ? and(...filterConditions) : undefined

  const sortParam = query.sort as string || 'default'

  const subcategoryFacetWhere = scopeCategory
    ? (scopeWhere
        ? and(scopeWhere, eq(tables.categories.parentId, scopeCategory.id))
        : eq(tables.categories.parentId, scopeCategory.id))
    : undefined

  const [products, totalRow, priceRow, brandFacetRows, subcategoryFacetRows] = await Promise.all([
    db.query.products.findMany({
      where: fullWhere,
      limit,
      offset,
      with: { brand: true, category: true },
      orderBy: (products, { asc, desc }) => {
        switch (sortParam) {
          case 'price-asc': return [asc(products.price)]
          case 'price-desc': return [desc(products.price)]
          case 'name-asc': return [asc(products.name)]
          case 'name-desc': return [desc(products.name)]
          default: return [desc(products.createdAt)]
        }
      }
    }),
    db.select({ count: sql<number>`count(*)` })
      .from(tables.products)
      .where(fullWhere ?? sql`1=1`),
    db.select({
      min: sql<number | null>`min(${tables.products.price})`,
      max: sql<number | null>`max(${tables.products.price})`
    }).from(tables.products).where(scopeWhere ?? sql`1=1`),
    scopeBrand
      ? Promise.resolve([] as Array<{ slug: string; name: string; count: number }>)
      : db.select({
          slug: tables.brands.slug,
          name: tables.brands.name,
          count: sql<number>`count(*)`
        })
          .from(tables.products)
          .innerJoin(tables.brands, eq(tables.brands.id, tables.products.brandId))
          .where(scopeWhere ?? sql`1=1`)
          .groupBy(tables.brands.id, tables.brands.slug, tables.brands.name)
          .orderBy(desc(sql`count(*)`))
          .limit(50),
    scopeCategory && subcategoryFacetWhere
      ? db.select({
          slug: tables.categories.slug,
          name: tables.categories.name,
          count: sql<number>`count(*)`
        })
          .from(tables.products)
          .innerJoin(tables.categories, eq(tables.categories.id, tables.products.categoryId))
          .where(subcategoryFacetWhere)
          .groupBy(tables.categories.id, tables.categories.slug, tables.categories.name)
          .orderBy(desc(sql`count(*)`))
          .limit(50)
      : Promise.resolve([] as Array<{ slug: string; name: string; count: number }>)
  ])

  const total = totalRow[0]?.count ?? 0
  const priceMin = priceRow[0]?.min
  const priceMax = priceRow[0]?.max

  return {
    products,
    total,
    page,
    limit,
    facets: {
      price: priceMin != null && priceMax != null ? { min: priceMin, max: priceMax } : null,
      brands: scopeBrand ? null : brandFacetRows,
      subcategories: scopeCategory ? subcategoryFacetRows : null
    }
  }
})
