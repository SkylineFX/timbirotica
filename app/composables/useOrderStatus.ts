export type OrderStatus = 'processing' | 'confirmed' | 'shipped' | 'completed' | 'cancelled'
type BadgeColor = 'warning' | 'info' | 'success' | 'error' | 'neutral' | 'primary' | 'secondary'

export const ORDER_STATUS_LABEL: Record<string, string> = {
  processing: 'In procesare',
  confirmed: 'Confirmata',
  shipped: 'Expediata',
  completed: 'Finalizata',
  cancelled: 'Anulata',
}

export const ORDER_STATUS_COLOR: Record<string, BadgeColor> = {
  processing: 'warning',
  confirmed: 'primary',
  shipped: 'info',
  completed: 'success',
  cancelled: 'error',
}

export const ORDER_STATUS_VALUES: OrderStatus[] = ['processing', 'confirmed', 'shipped', 'completed', 'cancelled']

export function useOrderStatus() {
  return {
    label: (s: string) => ORDER_STATUS_LABEL[s] ?? s,
    color: (s: string): BadgeColor => ORDER_STATUS_COLOR[s] ?? 'neutral',
    values: ORDER_STATUS_VALUES,
  }
}
