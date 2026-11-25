import { eq, and, gt } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import * as Sentry from '@sentry/nuxt'
import { dispatchOrderEmails } from '../../utils/email'
import { generateProformaPdf, resolveProformaCustomer } from '../../utils/proforma'
import { buildOrderWrites } from '../../utils/orderWrites'
import { orderPayloadSchema, computeOrderTotals, MAX_ORDERS_PER_HOUR } from '~~/shared/constants/order'
import { productsWithInvalidQuantity, sameCartQuantities } from '~~/shared/utils/cart'

// CSRF posture: state-changing endpoints rely on nuxt-auth-utils' session cookie
// with SameSite=Lax (h3 default; nuxt.config only overrides `secure` for dev LAN).
// Lax blocks cross-site form/script POSTs to this endpoint, so no explicit token
// is used. Revisit if any future flow needs a stricter (SameSite=Strict) posture.

interface OrderCartItem {
  productId: number;
  quantity: number;
  product: { name: string; price: number };
}

/** Random 8-char hex order number, retrying on the (statistically negligible) collision. */
async function generateUniqueOrderNumber(db: ReturnType<typeof useDrizzle>, maxAttempts = 5): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = randomBytes(4).toString('hex').toUpperCase()
    const existing = await db.query.orders.findFirst({
      where: eq(tables.orders.orderNumber, candidate)
    })
    if (!existing) return candidate
  }
  throw createError({ statusCode: 500, message: 'Nu am putut genera un numar de comanda. Incearca din nou.' })
}

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readValidatedBody(event, orderPayloadSchema.parse)
  const db = useDrizzle()

  const userRecord = await db.query.users.findFirst({
    where: eq(tables.users.id, session.user.id)
  })

  if (!userRecord) {
    throw createError({ statusCode: 401, message: 'Utilizatorul nu a fost gasit.' })
  }

  if (!userRecord.emailVerifiedAt) {
    throw createError({ statusCode: 403, message: 'Trebuie sa confirmi adresa de email inainte de a plasa o comanda.' })
  }

  // Rate limit per account (see MAX_ORDERS_PER_HOUR). orders_user_id_idx keeps
  // this to the account's own order rows.
  const [recent] = await db.select({ count: sql<number>`count(*)` })
    .from(tables.orders)
    .where(and(
      eq(tables.orders.userId, session.user.id),
      gt(tables.orders.createdAt, new Date(Date.now() - 60 * 60 * 1000))
    ))
  if ((recent?.count ?? 0) >= MAX_ORDERS_PER_HOUR) {
    throw createError({
      statusCode: 429,
      message: `Ai plasat ${MAX_ORDERS_PER_HOUR} comenzi in ultima ora. Te rugam sa incerci din nou mai tarziu sau sa ne contactezi.`
    })
  }

  // 1. Fetch the user's cart holding the products. Only the product columns the
  //    order needs: a large cart would otherwise read every long description.
  const cart = await db.query.carts.findFirst({
    where: eq(tables.carts.userId, session.user.id),
    with: {
      items: {
        with: {
          product: { columns: { name: true, price: true, stock: true } }
        }
      }
    }
  })

  if (!cart || !cart.items || cart.items.length === 0) {
    throw createError({ statusCode: 400, message: 'Cosul de cumparaturi este gol.' })
  }

  // Backstop: the cart endpoints validate quantities, but re-check here so a bad
  // row (e.g. saved before that validation existed) can't produce a wrong total.
  // Two rows of one product are checked together, so they can't pass the maximum.
  const invalidProducts = productsWithInvalidQuantity(cart.items)
  if (invalidProducts.size) {
    const names = new Set(cart.items.filter(i => invalidProducts.has(i.productId)).map(i => i.product.name))
    throw createError({
      statusCode: 400,
      message: `Cantitate invalida pentru: ${[...names].join(', ')}. Actualizeaza cosul si reincearca.`
    })
  }

  const unavailable = cart.items.filter(i => (i.product?.stock ?? 0) <= 0)
  if (unavailable.length) {
    throw createError({
      statusCode: 409,
      message: `Urmatoarele produse nu mai sunt disponibile: ${unavailable.map(i => i.product.name).join(', ')}.`
    })
  }

  // Never sell a product without a valid price. A price of 0 or less can only
  // come from bad catalog data (e.g. an empty price in a scraper file).
  const unpriced = cart.items.filter(i => !(i.product.price > 0))
  if (unpriced.length) {
    throw createError({
      statusCode: 409,
      message: `Pretul nu este disponibil pentru: ${unpriced.map(i => i.product.name).join(', ')}. Te rugam sa ne contactezi.`
    })
  }

  // The cart ordered must be the cart the customer saw: the browser compares it
  // too, but a quantity change it gave up on can still be saved after its last
  // read, and another tab can change the cart. Older pages send no quantities.
  const shown = body.priceSnapshots
  if (shown?.length && shown.every(s => s.quantity !== undefined)) {
    const shownCart = shown.map(s => ({ productId: s.productId, quantity: s.quantity! }))
    if (!sameCartQuantities(shownCart, cart.items)) {
      throw createError({
        statusCode: 409,
        message: 'Cosul s-a actualizat. Verifica produsele si cantitatile, apoi plaseaza comanda din nou.',
        data: { cartChanged: true }
      })
    }
  }

  // Price-change guard: if any product's live price differs from what the
  // customer saw at submit time, abort with 409 so the client can refresh the
  // cart and have the user re-confirm. Snapshots are optional so older clients
  // still work (they'd just lose the guard).
  if (body.priceSnapshots && body.priceSnapshots.length > 0) {
    const snapByProduct = new Map(body.priceSnapshots.map(s => [s.productId, s.price]))
    const changed = cart.items.some(item => {
      const snap = snapByProduct.get(item.productId)
      return snap !== undefined && snap !== item.product.price
    })
    if (changed) {
      throw createError({
        statusCode: 409,
        message: 'Preturile s-au actualizat. Verifica comanda si reincearca.',
        data: { priceChanged: true }
      })
    }
  }

  // 2. Resolve addresses server-side from the user's saved rows.
  //    Never trust address data from the request body — accept only IDs and
  //    re-read the records, scoped to the session user.
  // A personal address is required for courier (delivery) and for an individual
  // invoice (persoana fizica). A pickup order billed to a company needs neither.
  let shippingAddress: typeof tables.addresses.$inferSelect | null = null
  if (body.shippingMethod === 'courier' || body.billingSameAsShipping) {
    if (!body.shippingAddressId) {
      throw createError({ statusCode: 400, message: 'Adresa este obligatorie.' })
    }
    shippingAddress = await db.query.addresses.findFirst({
      where: and(
        eq(tables.addresses.id, body.shippingAddressId),
        eq(tables.addresses.userId, session.user.id)
      )
    }) ?? null
    if (!shippingAddress) {
      throw createError({ statusCode: 404, message: 'Adresa selectata nu a fost gasita.' })
    }
  }

  let billingAddress: typeof tables.billingAddresses.$inferSelect | null = null
  if (!body.billingSameAsShipping) {
    if (!body.billingAddressId) {
      throw createError({ statusCode: 400, message: 'Datele de facturare sunt obligatorii.' })
    }
    billingAddress = await db.query.billingAddresses.findFirst({
      where: and(
        eq(tables.billingAddresses.id, body.billingAddressId),
        eq(tables.billingAddresses.userId, session.user.id)
      )
    }) ?? null
    if (!billingAddress) {
      throw createError({ statusCode: 404, message: 'Adresa de facturare selectata nu a fost gasita.' })
    }
  }

  // Individual invoice billed to a different saved address (Persoana fizica + "alta adresa")
  let billingPersonalAddress: typeof tables.addresses.$inferSelect | null = null
  if (body.billingSameAsShipping && body.billingPersonalAddressId) {
    billingPersonalAddress = await db.query.addresses.findFirst({
      where: and(
        eq(tables.addresses.id, body.billingPersonalAddressId),
        eq(tables.addresses.userId, session.user.id)
      )
    }) ?? null
    if (!billingPersonalAddress) {
      throw createError({ statusCode: 404, message: 'Adresa de facturare selectata nu a fost gasita.' })
    }
  }

  // 3. Compute accurate totals strictly from the server's database prices.
  //    Totals (incl. the pickup-is-free shipping rule) come from the shared
  //    computeOrderTotals so they can't drift from the summed line items.
  const { shippingCost, total } = computeOrderTotals(
    cart.items.map((item: OrderCartItem) => ({ quantity: item.quantity, price: item.product.price })),
    body.shippingMethod
  )

  // 4. Generate a unique order number for this order
  const date = new Date()
  const orderNumber = await generateUniqueOrderNumber(db)

  const shippingAddressSnapshot = JSON.stringify(shippingAddress || {})
  const billingAddressSnapshot = billingAddress
    ? JSON.stringify(billingAddress)
    : billingPersonalAddress
      ? JSON.stringify(billingPersonalAddress)
      : shippingAddressSnapshot

  // 5. Save the order row, its lines and the cart clearing in one batch. D1
  //    rejects BEGIN/COMMIT but runs a batch as one transaction, so a failure
  //    saves nothing and the customer can simply try again. buildOrderWrites
  //    splits the lines to fit D1's limit of 100 parameters per statement, so
  //    the number of products in an order is not limited.
  try {
    await db.batch(buildOrderWrites(db, {
      order: {
        userId: session.user.id,
        orderNumber,
        total,
        status: 'processing',
        shippingMethod: body.shippingMethod,
        paymentMethod: body.paymentMethod,
        shippingCost,
        shippingAddressSnapshot,
        billingAddressSnapshot,
        termsAcceptedAt: date,
        createdAt: date,
      },
      lines: cart.items.map((item: OrderCartItem) => ({
        productId: item.productId,
        quantity: item.quantity,
        priceAtBuy: item.product.price
      })),
      cartId: cart.id,
    }))
  } catch (err) {
    // An emptied cart means another submit of this cart (a second tab, a retry)
    // saved the order first, and buildOrderWrites refused to order it twice.
    const cartStillHasItems = await db.query.cartItems.findFirst({
      where: eq(tables.cartItems.cartId, cart.id),
      columns: { id: true }
    }).catch(() => true)
    if (!cartStillHasItems) {
      throw createError({ statusCode: 409, message: 'Comanda pentru acest cos a fost deja plasata. O gasesti in Comenzile mele.' })
    }
    console.error(`Saving order ${orderNumber} failed; nothing was saved.`, err)
    Sentry.captureException(err, { tags: { area: 'order-create', orderNumber } })
    throw createError({ statusCode: 500, message: 'Nu am putut plasa comanda. Te rugam sa incerci din nou.' })
  }

  // 7. Dispatch the order confirmation email asynchronously
  const emailItems = cart.items.map((item: OrderCartItem) => ({
    name: item.product.name,
    quantity: item.quantity,
    price: item.product.price
  }))

  // Render the "Adresa de livrare" email block only for courier orders. For
  // pickup + Persoana fizica the shipping record still exists (it's the
  // personal/invoice address picked under Persoana fizica), but it isn't a
  // delivery address — it's already surfaced via the billing snapshot.
  const emailShippingAddress = (shippingAddress && body.shippingMethod === 'courier') ? {
    fullName: `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim(),
    address: shippingAddress.street || '',
    city: shippingAddress.city || '',
    county: shippingAddress.county || '',
    phone: shippingAddress.phone || ''
  } : undefined

  // Always render the "Date de facturare" block — pick whichever billing source
  // resolved: company billing (Persoana juridica) → different individual billing
  // → shipping/personal address.
  const individualBilling = billingPersonalAddress ?? shippingAddress
  const emailBillingAddress = billingAddress ? {
    companyName: billingAddress.companyName,
    cui: (billingAddress.hasRo ? 'RO' : '') + (billingAddress.cui || ''),
    onrc: billingAddress.onrc || '',
    bankName: billingAddress.bankName || '',
    iban: billingAddress.iban || '',
    address: billingAddress.street || '',
    city: billingAddress.city || '',
    county: billingAddress.county || ''
  } : individualBilling ? {
    firstName: individualBilling.firstName || '',
    lastName: individualBilling.lastName || '',
    address: individualBilling.street || '',
    city: individualBilling.city || '',
    county: individualBilling.county || ''
  } : undefined

  // 8. Generate the proforma PDF (best-effort — order succeeds even if PDF fails)
  let proformaPdf: Uint8Array | undefined
  try {
    const customer = resolveProformaCustomer(billingAddress, billingPersonalAddress ?? shippingAddress, {
      firstName: userRecord.firstName,
      lastName: userRecord.lastName
    })
    proformaPdf = await generateProformaPdf({
      orderNumber,
      orderDate: date,
      paymentMethod: body.paymentMethod,
      shippingMethod: body.shippingMethod,
      shippingCost,
      total,
      items: cart.items.map((it: OrderCartItem) => ({
        name: it.product.name,
        quantity: it.quantity,
        priceAtBuy: it.product.price
      })),
      customer
    })
  } catch (err) {
    console.error('Proforma PDF generation failed (order will still be created):', err)
    Sentry.captureException(err, { tags: { area: 'order-proforma', orderNumber } })
  }

  const emailData = {
    orderNumber,
    customerName: shippingAddress?.firstName || session.user.firstName || 'Client',
    customerFullName: `${shippingAddress?.firstName || session.user.firstName || ''} ${shippingAddress?.lastName || session.user.lastName || ''}`.trim() || 'Client',
    customerEmail: userRecord.email,
    // The order's contact phone is the BILLING snapshot's phone — whichever billing
    // source resolved (company → different individual addr → shipping/personal addr).
    // Shipping's phone is kept separately in the shipping snapshot for the Livrare
    // box on the admin page. Account phone is a last-resort fallback for legacy
    // orders whose billing snapshot has no phone.
    customerPhone: (billingAddress ?? billingPersonalAddress ?? shippingAddress)?.phone || userRecord.phone || '',
    orderDate: date.toISOString(),
    paymentMethod: body.paymentMethod,
    shippingMethod: body.shippingMethod,
    total,
    shippingCost,
    items: emailItems,
    shippingAddress: emailShippingAddress,
    billingAddress: emailBillingAddress,
    attachment: proformaPdf ? {
      filename: `Proforma-${orderNumber}.pdf`,
      content: proformaPdf
    } : undefined
  }

  // Dispatch customer + admin emails in the background; failures are logged and
  // captured to Sentry inside dispatchOrderEmails (allSettled — one failure
  // doesn't drop the other). event.waitUntil keeps the serverless runtime alive.
  event.waitUntil(dispatchOrderEmails(emailData))

  return { success: true, orderNumber }
})
