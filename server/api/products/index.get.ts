import { inArray, like, and, or, eq, gte, lte, gt, sql } from "drizzle-orm"

export default eventHandler(async (event) => {
  const query = getQuery(event)
  const categorySlug = query.category as string | undefined
  const brandSlug = query.brand as string | undefined
  const searchQ = query.q as string | undefined

  const rawPage = Number(query.page)
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1
  const rawLimit = Number(query.limit)
  const limit = Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.min(Math.floor(rawLimit), 96) : 12
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

  const scopeConditions: any[] = []
  if (query.recommended === 'true') scopeConditions.push(eq(tables.products.isRecommended, true))
  if (scopeCategoryIds.length) scopeConditions.push(inArray(tables.products.categoryId, scopeCategoryIds))
  if (scopeBrand) scopeConditions.push(eq(tables.products.brandId, scopeBrand.id))
  if (searchQ) {
    const stripDiacritics = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    const searchTerms = stripDiacritics(searchQ).trim().split(/\s+/).filter(Boolean)
    if (searchTerms.length > 0) {
      const termConditions = searchTerms.map(term => or(
        like(tables.products.name, `%${term}%`),
        like(tables.products.sku, `%${term}%`)
      ))
      scopeConditions.push(and(...termConditions))
    }
  }
  const [selectedSubs, selectedBrands] = await Promise.all([
    subSlugs.length
      ? db.query.categories.findMany({
          where: scopeCategory
            ? and(
                inArray(tables.categories.slug, subSlugs),
                eq(tables.categories.parentId, scopeCategory.id)
              )
            : inArray(tables.categories.slug, subSlugs)
        })
      : Promise.resolve([] as Array<{ id: number }>),
    brandFilterSlugs.length && !scopeBrand
      ? db.query.brands.findMany({
          where: inArray(tables.brands.slug, brandFilterSlugs)
        })
      : Promise.resolve([] as Array<{ id: number }>)
  ])

  const priceConds: any[] = []
  if (minPrice !== undefined && !isNaN(minPrice)) priceConds.push(gte(tables.products.price, minPrice))
  if (maxPrice !== undefined && !isNaN(maxPrice)) priceConds.push(lte(tables.products.price, maxPrice))
  const availabilityCond = onlyAvailable ? gt(tables.products.stock, 0) : undefined
  const subCond = selectedSubs.length ? inArray(tables.products.categoryId, selectedSubs.map(s => s.id)) : undefined
  const brandCond = selectedBrands.length ? inArray(tables.products.brandId, selectedBrands.map(b => b.id)) : undefined

  const buildWhere = (opts: { excludePrice?: boolean; excludeAvailability?: boolean; excludeSub?: boolean; excludeBrand?: boolean } = {}) => {
    const conds = [...scopeConditions]
    if (!opts.excludePrice) conds.push(...priceConds)
    if (!opts.excludeAvailability && availabilityCond) conds.push(availabilityCond)
    if (!opts.excludeSub && subCond) conds.push(subCond)
    if (!opts.excludeBrand && brandCond) conds.push(brandCond)
    return conds.length ? and(...conds) : undefined
  }

  const fullWhere = buildWhere()
  const priceFacetWhere = buildWhere({ excludePrice: true })
  const brandFacetWhere = buildWhere({ excludeBrand: true })
  const subFacetWhere = buildWhere({ excludeSub: true })

  const sortParam = query.sort as string || 'default'

  const scopeOnlyWhere = scopeConditions.length ? and(...scopeConditions) : undefined

  const subcategoryFacetWhere = scopeCategory
    ? (subFacetWhere
        ? and(subFacetWhere, eq(tables.categories.parentId, scopeCategory.id))
        : eq(tables.categories.parentId, scopeCategory.id))
    : subFacetWhere

  const subcategoryScopeWhere = scopeCategory
    ? (scopeOnlyWhere
        ? and(scopeOnlyWhere, eq(tables.categories.parentId, scopeCategory.id))
        : eq(tables.categories.parentId, scopeCategory.id))
    : scopeOnlyWhere

  type FacetRow = { slug: string; name: string; count: number }
  const emptyFacetRows: FacetRow[] = []

  const [
    products,
    totalRow,
    priceRow,
    brandFacetRows,
    subcategoryFacetRows,
    brandScopeRows,
    subcategoryScopeRows
  ] = await Promise.all([
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
    }).from(tables.products).where(priceFacetWhere ?? sql`1=1`),
    scopeBrand
      ? Promise.resolve(emptyFacetRows)
      : db.select({
          slug: tables.brands.slug,
          name: tables.brands.name,
          count: sql<number>`count(*)`
        })
          .from(tables.products)
          .innerJoin(tables.brands, eq(tables.brands.id, tables.products.brandId))
          .where(brandFacetWhere ?? sql`1=1`)
          .groupBy(tables.brands.id, tables.brands.slug, tables.brands.name),
    db.select({
      slug: tables.categories.slug,
      name: tables.categories.name,
      count: sql<number>`count(*)`
    })
      .from(tables.products)
      .innerJoin(tables.categories, eq(tables.categories.id, tables.products.categoryId))
      .where(subcategoryFacetWhere ?? sql`1=1`)
      .groupBy(tables.categories.id, tables.categories.slug, tables.categories.name),
    scopeBrand
      ? Promise.resolve([] as Array<{ slug: string; name: string }>)
      : db.selectDistinct({
          slug: tables.brands.slug,
          name: tables.brands.name
        })
          .from(tables.products)
          .innerJoin(tables.brands, eq(tables.brands.id, tables.products.brandId))
          .where(scopeOnlyWhere ?? sql`1=1`),
    db.selectDistinct({
      slug: tables.categories.slug,
      name: tables.categories.name
    })
      .from(tables.products)
      .innerJoin(tables.categories, eq(tables.categories.id, tables.products.categoryId))
      .where(subcategoryScopeWhere ?? sql`1=1`)
  ])

  const total = totalRow[0]?.count ?? 0
  const priceMin = priceRow[0]?.min
  const priceMax = priceRow[0]?.max

  const mergeFacet = (scopeRows: Array<{ slug: string; name: string }>, countRows: FacetRow[]): FacetRow[] => {
    const counts = new Map(countRows.map(r => [r.slug, r.count]))
    return scopeRows
      .map(r => ({ slug: r.slug, name: r.name, count: counts.get(r.slug) ?? 0 }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ro'))
  }

  return {
    products,
    total,
    page,
    limit,
    facets: {
      price: priceMin != null && priceMax != null ? { min: priceMin, max: priceMax } : null,
      brands: scopeBrand ? null : mergeFacet(brandScopeRows, brandFacetRows),
      subcategories: mergeFacet(subcategoryScopeRows, subcategoryFacetRows)
    }
  }
})
