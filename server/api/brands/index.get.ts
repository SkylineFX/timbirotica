export default eventHandler(async () => {
  const brands = await useDrizzle().select().from(tables.brands)

  return brands.map((brand) => ({
    label: brand.name,
    to: `/producatori/${brand.slug}`,
    image: brand.image
  }))
})
