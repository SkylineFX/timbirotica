export default eventHandler(async (event) => {
  const allCategories = await useDrizzle().select().from(tables.categories)

  // Map to store categories by ID for easy lookup
  const categoryMap = new Map()

  // First pass: Create map and lightweight objects
  allCategories.forEach(cat => {
    categoryMap.set(cat.id, {
      label: cat.name,
      to: `/c/${cat.slug}`,
      id: cat.id,
      parentId: cat.parentId,
      image: cat.image,
      children: []
    })
  })

  const tree: any[] = []

  // Second pass: Build tree
  categoryMap.forEach(cat => {
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId)
      if (parent) {
        parent.children.push(cat)
      }
    } else {
      tree.push(cat)
    }
  })

  // Helper to clean up internal fields (id, parentId) if desired, 
  // though Nuxt UI navigation will just ignore extra fields. 
  // But let's keep it simple.

  return tree
})
