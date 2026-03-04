import { inArray, like, and } from "drizzle-orm"

export default eventHandler(async (event) => {
  const query = getQuery(event)
  console.log('API Query Params:', query)
  const categorySlug = query.category as string
  const brandSlug = query.brand as string
  const searchQ = query.q as string

  console.log('Category Slug:', categorySlug)

  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 12
  const offset = (page - 1) * limit

  let whereParams = []

  if (categorySlug) {
    const category = await useDrizzle().query.categories.findFirst({
      where: eq(tables.categories.slug, categorySlug)
    })

    if (category) {
      const subcategories = await useDrizzle().query.categories.findMany({
        where: eq(tables.categories.parentId, category.id)
      })

      const categoryIds = [category.id, ...subcategories.map(c => c.id)]
      whereParams.push(inArray(tables.products.categoryId, categoryIds))
    } else {
      return {
        products: [],
        total: 0,
        page,
        limit
      }
    }
  }

  if (brandSlug) {
    const brand = await useDrizzle().query.brands.findFirst({
      where: eq(tables.brands.slug, brandSlug)
    })

    if (brand) {
      whereParams.push(eq(tables.products.brandId, brand.id))
    } else {
      return {
        products: [],
        total: 0,
        page,
        limit
      }
    }
  }

  if (searchQ) {
    whereParams.push(like(tables.products.name, `%${searchQ}%`))
  }

  const where = whereParams.length > 0 ? and(...whereParams) : undefined

  const sortParam = query.sort as string || 'default'

  // 1. Get products with pagination
  const products = await useDrizzle().query.products.findMany({
    where,
    limit,
    offset,
    with: {
      brand: true,
      category: true
    },
    orderBy: (products, { asc, desc }) => {
      switch (sortParam) {
        case 'price-asc':
          return [asc(products.price)]
        case 'price-desc':
          return [desc(products.price)]
        case 'name-asc':
          return [asc(products.name)]
        case 'name-desc':
          return [desc(products.name)]
        default:
          return [desc(products.createdAt)]
      }
    }
  })

  // 2. Get total count
  // Drizzle doesn't have a clean count() on query builder yet, using raw sql or simpler select
  // For SQLite/LibSQL:
  const allProducts = await useDrizzle().select({ id: tables.products.id }).from(tables.products).where(where)
  const total = allProducts.length

  return {
    products,
    total,
    page,
    limit
  }
})
