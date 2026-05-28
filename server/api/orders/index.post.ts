import { eq, and } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import * as Sentry from '@sentry/nuxt'
import { dispatchOrderEmails } from '../../utils/email'
import { generateProformaPdf, resolveProformaCustomer } from '../../utils/proforma'
import { orderPayloadSchema, getShippingCost } from '~~/shared/constants/order'

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
    throw createError({ statusCode: 400, message: 'Cosul de cumparaturi este gol.' })
  }

  const unavailable = cart.items.filter(i => (i.product?.stock ?? 0) <= 0)
  if (unavailable.length) {
    throw createError({
      statusCode: 409,
      message: `Urmatoarele produse nu mai sunt disponibile: ${unavailable.map(i => i.product.name).join(', ')}.`
    })
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

  // 3. Compute accurate totals strictly from the server's database prices
  let subtotal = 0
  for (const item of cart.items) {
    subtotal += item.product.price * item.quantity
  }

  // Shipping cost from the shared rule (pickup is always free)
  const shippingCost = getShippingCost(body.shippingMethod, subtotal)
  const total = subtotal + shippingCost

  // 4. Generate a unique order number for this order
  const date = new Date()
  const orderNumber = await generateUniqueOrderNumber(db)

  const shippingAddressSnapshot = JSON.stringify(shippingAddress || {})
  const billingAddressSnapshot = billingAddress
    ? JSON.stringify(billingAddress)
    : billingPersonalAddress
      ? JSON.stringify(billingPersonalAddress)
      : shippingAddressSnapshot

  // 5. Atomically create the order row, its items, and clear the cart.
  //    Throwing inside the transaction rolls all three back together — no orphan
  //    orders, no orphaned cart items, no half-clear.
  await db.transaction(async (tx) => {
    const [created] = await tx.insert(tables.orders).values({
      userId: session.user.id,
      orderNumber,
      total,
      status: 'processing',
      shippingMethod: body.shippingMethod,
      paymentMethod: body.paymentMethod,
      shippingCost,
      shippingAddressSnapshot,
      billingAddressSnapshot,
      termsAcceptedAt: new Date(),
      createdAt: new Date(),
    }).returning()

    if (!created?.id) {
      throw createError({ statusCode: 500, message: 'Eroare la generarea comenzii.' })
    }

    await tx.insert(tables.orderItems).values(
      cart.items.map((item: OrderCartItem) => ({
        orderId: created.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtBuy: item.product.price
      }))
    )

    await tx.delete(tables.cartItems).where(eq(tables.cartItems.cartId, cart.id))
  })

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

  const emailBillingAddress = billingAddress ? {
    companyName: billingAddress.companyName,
    cui: (billingAddress.hasRo ? 'RO' : '') + (billingAddress.cui || ''),
    onrc: billingAddress.onrc || '',
    bankName: billingAddress.bankName || '',
    iban: billingAddress.iban || '',
    address: billingAddress.street || '',
    city: billingAddress.city || '',
    county: billingAddress.county || ''
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
