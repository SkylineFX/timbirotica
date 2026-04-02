import { eq } from "drizzle-orm"

export default eventHandler(async (event) => {
  const db = useDrizzle()

  // 1. Create the new category
  const newCategoryName = ""
  const newCategorySlug = ""
  const parentId = //-1

  let targetCategory = await db.query.categories.findFirst({
    where: eq(tables.categories.slug, newCategorySlug)
  })

  if (!targetCategory) {
    const inserted = await db.insert(tables.categories).values({
      name: newCategoryName,
      slug: newCategorySlug,
      parentId
    }).returning()

    targetCategory = inserted[0]
  }

  // 2. Exact product names to migrate
  const productsToMigrate = [
    //
  ]

  let updatedCount = 0

  // 3. Update the exact products
  for (const productName of productsToMigrate) {
    const dbProduct = await db.query.products.findFirst({
      where: eq(tables.products.name, productName.trim()) // Trim spaces just in case
    })

    if (dbProduct) {
      await db.update(tables.products)
        .set({ categoryId: targetCategory.id })
        .where(eq(tables.products.id, dbProduct.id))
      updatedCount++
    }
  }

  return {
    success: true,
    category: targetCategory,
    attempted: productsToMigrate.length,
    updated: updatedCount
  }
})

