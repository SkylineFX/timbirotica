export function usePendingOrders() {
  const count = useState<number>('admin-pending-count', () => 0)

  async function refresh() {
    try {
      const res = await $fetch<{ count: number }>('/api/admin/orders/pending-count')
      count.value = res.count
    } catch {
      // swallow — non-critical
    }
  }

  return { count, refresh }
}
