export default eventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  
  if (!slug) {
      throw createError({ statusCode: 400, message: 'Missing slug' })
  }
  
  const product = await useDrizzle().query.products.findFirst({
    where: eq(tables.products.slug, slug),
    with: {
        brand: true,
        category: true
    }
  })

  if (!product) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Product not found'
    })
  }

  return product
})
