import { and, eq } from 'drizzle-orm'
import { generateProformaPdf, resolveProformaCustomer } from '../../../../utils/proforma'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = parseInt(getRouterParam(event, 'id') ?? '')
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: 'ID comanda invalid.' })
  }

  const db = useDrizzle()
  const order = await db.query.orders.findFirst({
    where: and(eq(tables.orders.id, id), eq(tables.orders.userId, session.user.id)),
    with: {
      items: {
        with: {
          product: { columns: { name: true } }
        }
      }
    }
  })

  if (!order) {
    throw createError({ statusCode: 404, message: 'Comanda nu a fost gasita.' })
  }

  const user = await db.query.users.findFirst({
    where: eq(tables.users.id, session.user.id),
    columns: { firstName: true, lastName: true }
  })

  if (!user) {
    throw createError({ statusCode: 404, message: 'Utilizatorul nu a fost gasit.' })
  }

  const billingSnapshot = order.billingAddressSnapshot ? JSON.parse(order.billingAddressSnapshot) : null
  const shippingSnapshot = order.shippingAddressSnapshot ? JSON.parse(order.shippingAddressSnapshot) : null
  const customer = resolveProformaCustomer(
    billingSnapshot && billingSnapshot.companyName ? billingSnapshot : null,
    shippingSnapshot,
    user
  )

  const pdf = await generateProformaPdf({
    orderNumber: order.orderNumber,
    orderDate: order.createdAt,
    paymentMethod: order.paymentMethod,
    shippingMethod: order.shippingMethod,
    shippingCost: order.shippingCost,
    total: order.total,
    items: order.items.map(it => ({
      name: it.product.name,
      quantity: it.quantity,
      priceAtBuy: it.priceAtBuy
    })),
    customer
  })

  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `attachment; filename="Proforma-${order.orderNumber}.pdf"`)
  return pdf
})
