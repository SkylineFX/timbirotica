import type { AddressForm } from '~~/shared/schemas/address'
import type { BillingAddress } from '~~/shared/schemas/billingAddress'

/**
 * A saved delivery address, as AddressForm edits it: a row of
 * GET /api/user/addresses. The database stores an empty postal code and an
 * unset default as NULL.
 */
export type SavedAddress = Omit<AddressForm, 'postalCode' | 'isDefaultShipping'> & {
  id: number
  postalCode?: string | null
  isDefaultShipping?: boolean | null
}

/**
 * A saved company, as BillingAddressForm edits it: a row of
 * GET /api/user/billing-addresses. Optional fields left blank are NULL, and
 * rows saved before the phone column have no phone.
 */
export type SavedBillingAddress = Omit<BillingAddress, 'hasRo' | 'onrc' | 'bankName' | 'iban' | 'phone' | 'isDefaultBilling'> & {
  id: number
  hasRo?: boolean | null
  onrc?: string | null
  bankName?: string | null
  iban?: string | null
  phone?: string | null
  isDefaultBilling?: boolean | null
}

/**
 * The delivery address copied onto an order (orders.shippingAddressSnapshot,
 * a JSON string). A pickup order stores {}, and older orders may lack fields,
 * so every field is optional.
 */
export interface ShippingAddressSnapshot {
  firstName?: string
  lastName?: string
  phone?: string
  street?: string
  city?: string
  county?: string
  postalCode?: string | null
}

/**
 * Whoever the invoice is for, copied onto an order
 * (orders.billingAddressSnapshot, a JSON string): a company, another personal
 * address, or a copy of the delivery address. Every field is optional.
 */
export interface BillingAddressSnapshot extends Omit<ShippingAddressSnapshot, 'phone'> {
  companyName?: string
  cui?: string
  hasRo?: boolean | null
  onrc?: string | null
  bankName?: string | null
  iban?: string | null
  phone?: string | null
}
