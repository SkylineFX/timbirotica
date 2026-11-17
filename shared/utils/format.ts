// Formatting for documents and emails sent to customers (proforma, order
// emails). The server runs in UTC on Cloudflare Workers, so dates must name
// the shop's time zone explicitly; otherwise an order placed just after
// midnight in Romania shows the previous day.

export const SHOP_TIME_ZONE = 'Europe/Bucharest'

const dateFormat = new Intl.DateTimeFormat('ro-RO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: SHOP_TIME_ZONE,
})

const dateTimeFormat = new Intl.DateTimeFormat('ro-RO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: SHOP_TIME_ZONE,
})

const amountFormat = new Intl.NumberFormat('ro-RO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Date in Romanian time, e.g. "17.11.2026". */
export const formatShopDate = (date: Date | string | number): string =>
  dateFormat.format(new Date(date))

/** Date and time in Romanian time, e.g. "17 nov. 2026, 00:30". */
export const formatShopDateTime = (date: Date | string | number): string =>
  dateTimeFormat.format(new Date(date))

/** Amount with two decimals and Romanian separators, e.g. "1.199,40". */
export const formatAmount = (amount: number): string => amountFormat.format(amount)

/** Amount in lei, e.g. "1.199,40 RON". */
export const formatRon = (amount: number): string => `${formatAmount(amount)} RON`
