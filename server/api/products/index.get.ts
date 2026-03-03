import { inArray } from "drizzle-orm"

export default eventHandler(async (event) => {
  const query = getQuery(event)
  console.log('API Query Params:', query)
  const categorySlug = query.category as string
  console.log('Category Slug:', categorySlug)

  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 12
  const offset = (page - 1) * limit

  let where = undefined

  if (categorySlug) {
    const category = await useDrizzle().query.categories.findFirst({
      where: eq(tables.categories.slug, categorySlug)
    })

    if (category) {
      const subcategories = await useDrizzle().query.categories.findMany({
        where: eq(tables.categories.parentId, category.id)
      })

      const categoryIds = [category.id, ...subcategories.map(c => c.id)]
      where = inArray(tables.products.categoryId, categoryIds)
    } else {
      return {
        products: [],
        total: 0,
        page,
        limit
      }
    }
  }

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
