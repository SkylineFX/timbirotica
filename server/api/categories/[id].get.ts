import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const categoryId = idParam ? parseInt(idParam, 10) : null

  if (!categoryId || isNaN(categoryId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid category ID'
    })
  }

  const category = await useDrizzle().query.categories.findFirst({
    where: eq(tables.categories.id, categoryId)
  })

  if (!category) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Category not found'
    })
  }

  return category
})
