export type OrderStatus = 'processing' | 'shipped' | 'completed' | 'cancelled'
type BadgeColor = 'warning' | 'info' | 'success' | 'error' | 'neutral' | 'primary' | 'secondary'

export const ORDER_STATUS_LABEL: Record<string, string> = {
  processing: 'În procesare',
  shipped: 'Expediată',
  completed: 'Finalizată',
  cancelled: 'Anulată',
}

export const ORDER_STATUS_COLOR: Record<string, BadgeColor> = {
  processing: 'warning',
  shipped: 'info',
  completed: 'success',
  cancelled: 'error',
}

export const ORDER_STATUS_VALUES: OrderStatus[] = ['processing', 'shipped', 'completed', 'cancelled']

export function useOrderStatus() {
  return {
    label: (s: string) => ORDER_STATUS_LABEL[s] ?? s,
    color: (s: string): BadgeColor => ORDER_STATUS_COLOR[s] ?? 'neutral',
    values: ORDER_STATUS_VALUES,
  }
}
