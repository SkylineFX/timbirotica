

export default eventHandler(async (event) => {
   const session = await requireUserSession(event)
   if (!session.user || !session.user.id) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
   }

   const user = { id: session.user.id }
   const product1 = await useDrizzle().query.products.findFirst()
   const product2 = await useDrizzle().query.products.findMany({ limit: 2 })

   if (!product1) {
      return { success: false, error: 'No products found!' }
   }

   const p2 = product2[1]

   const orderRes = await useDrizzle().insert(tables.orders).values({
      userId: user.id,
      orderNumber: `CMD-${Math.floor(100000 + Math.random() * 900000)}`,
      total: product1.price * 2 + (p2 ? p2.price : 0),
      status: 'completed',
      createdAt: new Date()
   }).returning()

   const orderId = orderRes[0].id

   await useDrizzle().insert(tables.orderItems).values({
      orderId,
      productId: product1.id,
      quantity: 2,
      priceAtBuy: product1.price
   })

   if (p2) {
      await useDrizzle().insert(tables.orderItems).values({
         orderId,
         productId: p2.id,
         quantity: 1,
         priceAtBuy: p2.price
      })
   }

   return { success: true, orderId }
})
