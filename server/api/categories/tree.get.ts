import { buildCategoryTree } from '~~/shared/utils/categoryTree'

export default eventHandler(async () => {
  const rows = await useDrizzle().select().from(tables.categories)
  return buildCategoryTree(rows)
})
