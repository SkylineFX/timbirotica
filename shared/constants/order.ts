import { z } from 'zod'

// Single source of truth for order method values, labels, and shipping cost.
// Shared by the checkout UI, the order endpoint (validation + cost), the order
// emails, and the order-detail pages so these never drift apart.

export const SHIPPING_METHODS = ['courier', 'pickup'] as const
export const PAYMENT_METHODS = ['transfer', 'cash'] as const

export type ShippingMethod = typeof SHIPPING_METHODS[number]
export type PaymentMethod = typeof PAYMENT_METHODS[number]

// Customer-facing labels (unaccented Romanian)
export const SHIPPING_METHOD_LABELS: Record<ShippingMethod, string> = {
  courier: 'Curier',
  pickup: 'Ridicare personala',
}
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  transfer: 'Transfer bancar',
  cash: 'Ramburs',
}

export const shippingMethodLabel = (m: string): string =>
  SHIPPING_METHOD_LABELS[m as ShippingMethod] ?? m
export const paymentMethodLabel = (m: string): string =>
  PAYMENT_METHOD_LABELS[m as PaymentMethod] ?? m

// Order statuses. A new order starts as 'processing'.
export const ORDER_STATUS_VALUES = ['processing', 'confirmed', 'shipped', 'completed', 'cancelled'] as const

export type OrderStatus = typeof ORDER_STATUS_VALUES[number]

export const ORDER_STATUS_LABEL: Record<string, string> = {
  processing: 'In procesare',
  confirmed: 'Confirmata',
  shipped: 'Expediata',
  completed: 'Finalizata',
  cancelled: 'Anulata',
}

// The statuses an admin can move an order to from each status. Completed and
// cancelled orders are final. A customer can only cancel an order in processing.
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  processing: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled', 'processing'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
}

/** Whether an admin can move an order from one status to another. */
export const canChangeOrderStatus = (from: string, to: string): boolean =>
  ORDER_STATUS_TRANSITIONS[from as OrderStatus]?.includes(to as OrderStatus) ?? false

// Shipping cost rules
export const FREE_SHIPPING_THRESHOLD = 200
export const COURIER_SHIPPING_COST = 30

/** Courier cost for a subtotal — free at or above the threshold. */
export const getCourierShippingCost = (subtotal: number): number =>
  subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : COURIER_SHIPPING_COST

/** Shipping cost for a method + subtotal (pickup is always free). */
export const getShippingCost = (method: ShippingMethod, subtotal: number): number =>
  method === 'courier' ? getCourierShippingCost(subtotal) : 0

export interface OrderLineItem {
  quantity: number
  price: number
}

export interface OrderTotals {
  subtotal: number
  shippingCost: number
  total: number
}

/**
 * An amount in lei rounded to whole bani. Summing prices in floating point leaves
 * tails such as 9244.300000000003; prices have at most two decimals, so the exact
 * sum is always a whole number of bani and rounding restores it.
 */
export const roundToBani = (amount: number): number => Math.round(amount * 100) / 100

/**
 * Order totals from line items + shipping method. Single source of truth shared by
 * the order endpoint so the stored total can never drift from the summed line items.
 */
export const computeOrderTotals = (
  items: OrderLineItem[],
  shippingMethod: ShippingMethod,
): OrderTotals => {
  let sum = 0
  for (const item of items) {
    sum += item.price * item.quantity
  }
  const subtotal = roundToBani(sum)
  const shippingCost = getShippingCost(shippingMethod, subtotal)
  return { subtotal, shippingCost, total: roundToBani(subtotal + shippingCost) }
}

// Orders one account can place in an hour. Each order sends two emails with a
// PDF, so a script with one verified account could otherwise use up the email
// quota that password resets and order confirmations also need.
export const MAX_ORDERS_PER_HOUR = 5

// Payload accepted by POST /api/orders. Addresses are passed as IDs only and
// re-resolved server-side; the courier-needs-an-address rule is enforced in the
// handler (it requires a DB lookup anyway).
export const orderPayloadSchema = z.object({
  shippingMethod: z.enum(SHIPPING_METHODS),
  paymentMethod: z.enum(PAYMENT_METHODS),
  shippingAddressId: z.number().int().positive().nullable().optional(),
  billingSameAsShipping: z.boolean(),
  billingAddressId: z.number().int().positive().nullable().optional(),
  // A different saved personal address used as the individual invoice (Persoana fizica)
  billingPersonalAddressId: z.number().int().positive().nullable().optional(),
  // Customer must explicitly accept T&C; recorded server-side as proof of consent
  termsAccepted: z.literal(true),
  // Snapshot of the prices the customer saw at submit time. The server compares
  // each entry to the live DB price and rejects with 409 on any mismatch so the
  // customer can re-confirm before being charged a different amount.
  priceSnapshots: z.array(z.object({
    productId: z.number().int().positive(),
    price: z.number().nonnegative()
  })).optional()
})

export type OrderPayload = z.infer<typeof orderPayloadSchema>
