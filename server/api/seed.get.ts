import path from 'path'
import fs from 'fs'

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Decompose combined characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (accents)
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

export default eventHandler(async (event) => {
  const categories = await fs.promises.readFile(path.resolve('public', 'categories.json'), 'utf-8')
  const categoriesJson = JSON.parse(categories)

  const brands = await fs.promises.readFile(path.resolve('public', 'brands.json'), 'utf-8')
  const brandsJson = JSON.parse(brands)
  const insertedBrands = []

  for (const brand of brandsJson) {
    const brandSlug = slugify(brand.title)
    const existingBrand = await useDrizzle().query.brands.findFirst({
      where: eq(tables.brands.slug, brandSlug)
    })

    if (!existingBrand) {
      await useDrizzle().insert(tables.brands).values({
        name: brand.title,
        slug: brandSlug,
        image: brand.image_url
      }).run()
      insertedBrands.push(brand.title)
    }
  }

  const insertedCategories = []

  // Insert Categories
  for (const cat of categoriesJson) {
      const parentSlug = slugify(cat.category)
      let parent = await useDrizzle().query.categories.findFirst({
        where: eq(tables.categories.slug, parentSlug)
      })

      if (!parent) {
        const [newParent] = await useDrizzle().insert(tables.categories).values({
          name: cat.category,
          slug: parentSlug,
        }).returning()
        parent = newParent
        insertedCategories.push(parent.name)
      }

      if (cat.subcategories) {
        for (const sub of cat.subcategories) {
           const subSlug = slugify(sub.subcategory_name)
           const existingSub = await useDrizzle().query.categories.findFirst({
              where: eq(tables.categories.slug, subSlug)
           })
           
           if (!existingSub) {
             await useDrizzle().insert(tables.categories).values({
               name: sub.subcategory_name,
               slug: subSlug,
               parentId: parent.id
             })
             insertedCategories.push(sub.subcategory_name)
           }
        }
      }
  }

  return {
    message: 'Seeding completed',
    categories: { count: insertedCategories.length, names: insertedCategories },
    brands: { count: insertedBrands.length, names: insertedBrands }
  }
})
