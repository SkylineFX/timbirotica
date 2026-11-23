import { ORDER_STATUS_LABEL, ORDER_STATUS_VALUES, type OrderStatus } from '~~/shared/constants/order'

// The status values and labels live in shared/ so the server checks the same list.
export { ORDER_STATUS_LABEL, ORDER_STATUS_VALUES }
export type { OrderStatus }

type BadgeColor = 'warning' | 'info' | 'success' | 'error' | 'neutral' | 'primary' | 'secondary'

export const ORDER_STATUS_COLOR: Record<string, BadgeColor> = {
  processing: 'warning',
  confirmed: 'primary',
  shipped: 'info',
  completed: 'success',
  cancelled: 'error',
}

export function useOrderStatus() {
  return {
    label: (s: string) => ORDER_STATUS_LABEL[s] ?? s,
    color: (s: string): BadgeColor => ORDER_STATUS_COLOR[s] ?? 'neutral',
    values: ORDER_STATUS_VALUES,
  }
}
