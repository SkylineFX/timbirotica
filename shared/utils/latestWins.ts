/**
 * Sends the latest value per key, one request at a time per key.
 *
 * Used for cart quantities: clicking + three times quickly asks for 2, 3 and 4.
 * Sending all three at once could reach the server out of order and leave it
 * at 3 while the page shows 4. Here 2 is sent at once, 3 and 4 wait, and when
 * 2 is done only 4 is sent: the server always ends on the last value, with at
 * most two requests per burst and no delay before the first.
 *
 * When a request fails, the value still waiting for that key is dropped and
 * `onError` gets the last value the server confirmed, so the page can show it.
 */
export interface LatestWinsSender<V> {
  /** Sends `value` for `key`. `current` is what the server holds now (used if the first send fails). */
  set(key: number, value: V, current: V): void
  /** Resolves when every value set so far has been sent or has failed. */
  flush(): Promise<void>
  /** Drops the value waiting for `key` and resolves when its request in flight is done. */
  cancel(key: number): Promise<void>
}

export function createLatestWinsSender<V>(
  send: (key: number, value: V) => Promise<unknown>,
  onError: (key: number, confirmed: V, error: unknown) => void
): LatestWinsSender<V> {
  interface Entry { confirmed: V; waiting: { value: V } | null; running: Promise<void> }
  const entries = new Map<number, Entry>()

  // Starts sending at once. The entry is already in `entries`, and `send`
  // always yields, so values set meanwhile wait in `entry.waiting`.
  const run = async (key: number, entry: Entry) => {
    while (entry.waiting) {
      const { value } = entry.waiting
      entry.waiting = null
      try {
        await send(key, value)
        entry.confirmed = value
      } catch (error) {
        entry.waiting = null
        onError(key, entry.confirmed, error)
        break
      }
    }
    entries.delete(key)
  }

  return {
    set(key, value, current) {
      const entry = entries.get(key)
      if (entry) {
        entry.waiting = { value }
        return
      }
      const created = { confirmed: current, waiting: { value } } as Entry
      entries.set(key, created)
      created.running = run(key, created)
    },
    async flush() {
      await Promise.all([...entries.values()].map(e => e.running))
    },
    async cancel(key) {
      const entry = entries.get(key)
      if (!entry) return
      entry.waiting = null
      await entry.running
    },
  }
}
