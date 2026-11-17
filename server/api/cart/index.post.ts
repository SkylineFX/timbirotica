import { z } from 'zod'
import { cartQuantitySchema, productIdSchema, CART_MAX_QUANTITY } from '~~/shared/schemas/cart'

const addToCartSchema = z.object({
  productId: productIdSchema,
  quantity: cartQuantitySchema.default(1)
}, { error: 'Date invalide.' })

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ status: 401, message: 'Unauthorized' })
  }

  const { productId, quantity } = await readBodyWithSchema(event, addToCartSchema)
  const userId = session.user.id
  const db = useDrizzle()

  const product = await db.query.products.findFirst({
    where: eq(tables.products.id, productId),
    columns: { id: true, stock: true, name: true }
  })
  if (!product) {
    throw createError({ statusCode: 404, message: 'Produsul nu exista.' })
  }
  if (product.stock <= 0) {
    throw createError({ statusCode: 409, message: `Produsul "${product.name}" nu este disponibil.` })
  }

  // 1. Get or Create Cart
  const cart = await getOrCreateCart(userId)

  // 2. Check if item exists in cart
  const existingItem = await db.query.cartItems.findFirst({
    where: and(
      eq(tables.cartItems.cartId, cart.id),
      eq(tables.cartItems.productId, productId)
    )
  })

  if (existingItem) {
    // Update quantity
    // Cap so repeated adds can't push the line past the allowed maximum.
    await db.update(tables.cartItems)
      .set({ quantity: Math.min(existingItem.quantity + quantity, CART_MAX_QUANTITY) })
      .where(eq(tables.cartItems.id, existingItem.id))
  } else {
    // Insert new item
    await db.insert(tables.cartItems).values({
      cartId: cart.id,
      productId,
      quantity
    })
  }

  return { success: true }
})
