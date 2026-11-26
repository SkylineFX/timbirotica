import { z } from 'zod'
import { fromBani, sumLines, toBani } from '~~/shared/utils/money'

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

// Courier delivery time in working days, as the checkout states it: delivered
// in 2-3 working days, made of 1-2 days to dispatch (the terms page's 24-48
// hours) and 1 day with the courier. The checkout and terms pages hardcode
// these: change them together.
export const COURIER_HANDLING_DAYS = { min: 1, max: 2 }
export const COURIER_TRANSIT_DAYS = { min: 1, max: 1 }

// Return terms, as stated on the terms page (/termeni-si-conditii#retur), which
// hardcodes them: change both together. The customer pays the return shipping.
export const RETURN_WINDOW_DAYS = 14
export const RETURN_SHIPPING_COST = 30

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
export const roundToBani = (amount: number): number => fromBani(toBani(amount))

/**
 * Order totals from line items + shipping method. Single source of truth shared by
 * the order endpoint so the stored total can never drift from the summed line items.
 */
export const computeOrderTotals = (
  items: OrderLineItem[],
  shippingMethod: ShippingMethod,
): OrderTotals => {
  // Added up in whole bani (shared/utils/money.ts), so the free-shipping test
  // and the stored total see the exact amount.
  const subtotalBani = sumLines(items)
  const subtotal = fromBani(subtotalBani)
  const shippingCost = getShippingCost(shippingMethod, subtotal)
  return { subtotal, shippingCost, total: fromBani(subtotalBani + toBani(shippingCost)) }
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
  // Snapshot of the cart the customer saw at submit time, one entry per line.
  // The server compares each price to the live DB price, and the products and
  // quantities to the cart it orders, and rejects with 409 on any difference so
  // the customer can re-confirm. Quantity is optional for pages loaded before it
  // was sent; without it only the prices are checked.
  priceSnapshots: z.array(z.object({
    productId: z.number().int().positive(),
    price: z.number().nonnegative(),
    quantity: z.number().int().positive().optional()
  })).optional()
})

export type OrderPayload = z.infer<typeof orderPayloadSchema>
