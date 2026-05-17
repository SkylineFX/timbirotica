export default defineSitemapEventHandler(async () => {
  const db = useDrizzle()

  const [categories, products, brands] = await Promise.all([
    db.query.categories.findMany({
      columns: { slug: true }
    }),
    db.query.products.findMany({
      columns: { slug: true },
      with: {
        category: { columns: { slug: true } }
      }
    }),
    db.query.brands.findMany({
      columns: { slug: true }
    })
  ])

  return [
    ...categories.map(c => ({ loc: `/c/${c.slug}` })),
    ...products.map(p => ({ loc: `/c/${p.category?.slug ?? 'toate'}/${p.slug}` })),
    ...brands.map(b => ({ loc: `/producatori/${b.slug}` }))
  ]
})
