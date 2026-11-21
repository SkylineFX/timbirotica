/**
 * Sends the latest value per key: after a quiet period, and one request at a
 * time per key.
 *
 * Used for cart quantities, with a 300 ms wait:
 * - Each change restarts the key's wait, and the value is sent when no change
 *   came for 300 ms. A burst of clicks, or holding + down, is one request.
 * - While a key's request is in flight, nothing else is sent for that key.
 *   Changes made meanwhile wait, keeping only the newest, so requests can't
 *   reach the server out of order and it always ends on the last value.
 * - When a request fails, the value still waiting for that key is dropped and
 *   `onError` gets the last value the server confirmed, so the page can show it.
 *
 * Keys are independent: changing one doesn't delay or replace another.
 */
export interface LatestWinsSender<V> {
  /** Queues `value` for `key`. `current` is what the server holds now (reported if the first send fails). */
  set(key: number, value: V, current: V): void
  /** Sends waiting values now, skipping the wait, and resolves when every key is done. */
  flush(): Promise<void>
  /** Drops the value waiting for `key` and resolves when its request in flight is done. */
  cancel(key: number): Promise<void>
}

export function createLatestWinsSender<V>(
  send: (key: number, value: V) => Promise<unknown>,
  onError: (key: number, confirmed: V, error: unknown) => void,
  { delayMs = 0 }: { delayMs?: number } = {}
): LatestWinsSender<V> {
  interface Entry {
    confirmed: V
    waiting: { value: V } | null
    inFlight: Promise<void> | null
    timer: ReturnType<typeof setTimeout> | null
    idle: Promise<void>
    resolveIdle: () => void
  }
  const entries = new Map<number, Entry>()

  const stopTimer = (entry: Entry) => {
    if (entry.timer !== null) clearTimeout(entry.timer)
    entry.timer = null
  }

  // Sends the waiting value if nothing is in flight and the wait is over, or
  // forgets the key once there is nothing left to send.
  const pump = (key: number, entry: Entry) => {
    if (entry.inFlight || entry.timer !== null) return
    if (!entry.waiting) {
      entries.delete(key)
      entry.resolveIdle()
      return
    }
    const { value } = entry.waiting
    entry.waiting = null
    entry.inFlight = (async () => {
      try {
        await send(key, value)
        entry.confirmed = value
      } catch (error) {
        entry.waiting = null
        stopTimer(entry)
        onError(key, entry.confirmed, error)
      }
      entry.inFlight = null
      pump(key, entry)
    })()
  }

  return {
    set(key, value, current) {
      let entry = entries.get(key)
      if (!entry) {
        let resolveIdle!: () => void
        const idle = new Promise<void>(resolve => { resolveIdle = resolve })
        entry = { confirmed: current, waiting: null, inFlight: null, timer: null, idle, resolveIdle }
        entries.set(key, entry)
      }
      entry.waiting = { value }
      stopTimer(entry)
      if (delayMs > 0) {
        const scheduled = entry
        scheduled.timer = setTimeout(() => {
          scheduled.timer = null
          pump(key, scheduled)
        }, delayMs)
      } else {
        pump(key, entry)
      }
    },
    async flush() {
      const pending = [...entries]
      for (const [key, entry] of pending) {
        stopTimer(entry)
        pump(key, entry)
      }
      await Promise.all(pending.map(([, entry]) => entry.idle))
    },
    async cancel(key) {
      const entry = entries.get(key)
      if (!entry) return
      stopTimer(entry)
      entry.waiting = null
      if (entry.inFlight) await entry.inFlight
      else pump(key, entry)
    },
  }
}
