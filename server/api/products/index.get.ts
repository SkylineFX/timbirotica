import { inArray } from "drizzle-orm"

export default eventHandler(async (event) => {
  const query = getQuery(event)
  const categorySlug = query.category as string

  let where = undefined

  if (categorySlug) {
    // Find the category first
    const category = await useDrizzle().query.categories.findFirst({
        where: eq(tables.categories.slug, categorySlug)
    })

    if (category) {
        // Find all subcategories IDs (including the parent itself if desired, though current schema implies products are on subs)
        // Check if this is a parent or sub?
        // If parent, get all children.
        const subcategories = await useDrizzle().query.categories.findMany({
            where: eq(tables.categories.parentId, category.id)
        })
        
        const categoryIds = [category.id, ...subcategories.map(c => c.id)]
        
        where = inArray(tables.products.categoryId, categoryIds)
    } else {
        // Category not found, return empty or error? empty for now
        return []
    }
  }

  const products = await useDrizzle().query.products.findMany({
    where,
    with: {
        brand: true,
        category: true
    }
  })

  return products
})
