import { eq } from 'drizzle-orm'
import { randomBytes } from 'crypto'

interface OrderCartItem {
  productId: number;
  quantity: number;
  product: { price: number };
}

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readBody(event)
  const db = useDrizzle()

  // 1. Fetch the user's cart holding the products
  const cart = await db.query.carts.findFirst({
    where: eq(tables.carts.userId, session.user.id),
    with: {
      items: {
        with: {
          product: true
        }
      }
    }
  })

  if (!cart || !cart.items || cart.items.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Cosul de cumparaturi este gol.' })
  }

  // 2. Validate addressing requirements natively to prevent bad payloads
  if (body.shippingMethod === 'courier' && !body.shippingAddress) {
    throw createError({ statusCode: 400, statusMessage: 'Adresa de livrare este obligatorie pentru comanda prin curier.' })
  }

  // 3. Compute accurate totals strictly from the server's database prices
  let subtotal = 0
  for (const item of cart.items) {
    subtotal += item.product.price * item.quantity
  }

  // Cost mapping exactly mirroring the frontend logical rules
  const shippingCost = body.shippingMethod === 'courier' ? 30 : 0
  const total = subtotal + shippingCost

  // 4. Generate pseudo-random, standardized order number: YYMMDD-XXXXXX with guaranteed uniqueness
  const date = new Date()
  const yymmdd = date.toISOString().split('T')[0]!.replace(/-/g, '').substring(2)

  let orderNumber = ''
  let isUnique = false

  while (!isUnique) {
    const randomStr = randomBytes(3).toString('hex').toUpperCase()
    orderNumber = `${yymmdd}-${randomStr}`

    // Validate uniqueness against the DB to permanently avoid collision
    const existingOrder = await db.query.orders.findFirst({
      where: eq(tables.orders.orderNumber, orderNumber)
    })

    if (!existingOrder) {
      isUnique = true
    }
  }

  const shippingAddressSnapshot = JSON.stringify(body.shippingAddress || {})
  const billingAddressSnapshot = body.billingAddress ? JSON.stringify(body.billingAddress) : shippingAddressSnapshot

  // 5. Run standard sequential insertion (Drizzle SQLite natively handles it fast)
  const newOrder = await db.insert(tables.orders).values({
    userId: session.user.id,
    orderNumber,
    total,
    status: 'processing',
    shippingMethod: body.shippingMethod,
    paymentMethod: body.paymentMethod,
    shippingCost,
    shippingAddressSnapshot,
    billingAddressSnapshot,
    createdAt: new Date(),
  }).returning()

  const orderId = newOrder[0]?.id

  if (!orderId) {
    throw createError({ statusCode: 500, statusMessage: 'Eroare la generarea comenzii.' })
  }

  // Build items array matching current historical pricing
  const orderItemsPayload = cart.items.map((item: OrderCartItem) => ({
    orderId,
    productId: item.productId,
    quantity: item.quantity,
    priceAtBuy: item.product.price
  }))

  await db.insert(tables.orderItems).values(orderItemsPayload)

  // 6. Finalize successfully by clearing the cart's items
  await db.delete(tables.cartItems).where(eq(tables.cartItems.cartId, cart.id))

  return { success: true, orderNumber }
})
