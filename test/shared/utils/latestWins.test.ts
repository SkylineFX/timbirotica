import { describe, it, expect, vi } from 'vitest'
import { createLatestWinsSender } from '~~/shared/utils/latestWins'

// A send function whose requests stay open until the test settles them.
function fakeServer() {
  const requests: Array<{ key: number; value: number; resolve: () => void; reject: (e: Error) => void }> = []
  const send = (key: number, value: number) => new Promise<void>((resolve, reject) => {
    requests.push({ key, value, resolve, reject })
  })
  return { requests, send }
}

const tick = () => new Promise(r => setTimeout(r, 0))

describe('createLatestWinsSender', () => {
  it('sends the first value at once and only the latest of the ones that waited', async () => {
    const { requests, send } = fakeServer()
    const sender = createLatestWinsSender(send, vi.fn())
    sender.set(1, 2, 1)
    sender.set(1, 3, 1)
    sender.set(1, 4, 1)
    await tick()
    expect(requests.map(r => r.value)).toEqual([2])
    requests[0]!.resolve()
    await tick()
    expect(requests.map(r => r.value)).toEqual([2, 4])
    requests[1]!.resolve()
    await sender.flush()
    expect(requests).toHaveLength(2)
  })

  it('keeps one request in flight per key, and keys apart in parallel', async () => {
    const { requests, send } = fakeServer()
    const sender = createLatestWinsSender(send, vi.fn())
    sender.set(1, 5, 1)
    sender.set(2, 7, 1)
    sender.set(1, 6, 1)
    await tick()
    expect(requests.map(r => [r.key, r.value])).toEqual([[1, 5], [2, 7]])
    requests.forEach(r => r.resolve())
    await tick()
    expect(requests.map(r => [r.key, r.value])).toEqual([[1, 5], [2, 7], [1, 6]])
    requests[2]!.resolve()
    await sender.flush()
  })

  it('flush waits for requests in flight and the values waiting behind them', async () => {
    const { requests, send } = fakeServer()
    const sender = createLatestWinsSender(send, vi.fn())
    sender.set(1, 2, 1)
    sender.set(1, 3, 1)
    let flushed = false
    const flushing = sender.flush().then(() => { flushed = true })
    await tick()
    requests[0]!.resolve()
    await tick()
    expect(flushed).toBe(false)
    requests[1]!.resolve()
    await flushing
    expect(flushed).toBe(true)
  })

  it('on failure drops the waiting value and reports the last confirmed one', async () => {
    const { requests, send } = fakeServer()
    const onError = vi.fn()
    const sender = createLatestWinsSender(send, onError)
    sender.set(1, 2, 1)
    await tick()
    requests[0]!.resolve() // the server now holds 2
    await sender.flush()
    sender.set(1, 3, 2)
    sender.set(1, 4, 2)
    await tick()
    const error = new Error('offline')
    requests[1]!.reject(error)
    await sender.flush()
    expect(onError).toHaveBeenCalledWith(1, 2, error)
    expect(requests.map(r => r.value)).toEqual([2, 3])
  })

  it('reports the value the server held before, when the first request fails', async () => {
    const { requests, send } = fakeServer()
    const onError = vi.fn()
    const sender = createLatestWinsSender(send, onError)
    sender.set(9, 5, 3)
    await tick()
    requests[0]!.reject(new Error('409'))
    await sender.flush()
    expect(onError).toHaveBeenCalledWith(9, 3, expect.any(Error))
  })

  it('cancel drops the waiting value and waits for the request in flight', async () => {
    const { requests, send } = fakeServer()
    const sender = createLatestWinsSender(send, vi.fn())
    sender.set(1, 2, 1)
    sender.set(1, 3, 1)
    await tick()
    let cancelled = false
    const cancelling = sender.cancel(1).then(() => { cancelled = true })
    await tick()
    expect(cancelled).toBe(false)
    requests[0]!.resolve()
    await cancelling
    await sender.flush()
    expect(requests.map(r => r.value)).toEqual([2])
  })

  it('starts fresh for a key once it is idle', async () => {
    const { requests, send } = fakeServer()
    const sender = createLatestWinsSender(send, vi.fn())
    sender.set(1, 2, 1)
    await tick()
    requests[0]!.resolve()
    await sender.flush()
    sender.set(1, 8, 2)
    await tick()
    expect(requests.map(r => r.value)).toEqual([2, 8])
    requests[1]!.resolve()
    await sender.flush()
  })
})

describe('createLatestWinsSender with a wait', () => {
  const DELAY = 300

  // Fake timers for the wait; the fake server still resolves on demand.
  const setup = () => {
    vi.useFakeTimers()
    const server = fakeServer()
    const onError = vi.fn()
    const sender = createLatestWinsSender(server.send, onError, { delayMs: DELAY })
    return { ...server, onError, sender }
  }
  const settle = () => vi.advanceTimersByTimeAsync(0)

  it('sends one request, with the last value, after the clicks stop', async () => {
    const { requests, sender } = setup()
    for (let value = 2; value <= 6; value++) {
      sender.set(1, value, 1)
      await vi.advanceTimersByTimeAsync(60) // a held button repeats every 60 ms
    }
    expect(requests).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(DELAY)
    expect(requests.map(r => r.value)).toEqual([6])
    requests[0]!.resolve()
    await sender.flush()
    vi.useRealTimers()
  })

  it('restarts the wait on every change', async () => {
    const { requests, sender } = setup()
    sender.set(1, 2, 1)
    await vi.advanceTimersByTimeAsync(DELAY - 1)
    sender.set(1, 3, 1)
    await vi.advanceTimersByTimeAsync(DELAY - 1)
    expect(requests).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(1)
    expect(requests.map(r => r.value)).toEqual([3])
    requests[0]!.resolve()
    await sender.flush()
    vi.useRealTimers()
  })

  it('flush sends at once, skipping the wait, and resolves after the answer', async () => {
    const { requests, sender } = setup()
    sender.set(1, 4, 1)
    let flushed = false
    const flushing = sender.flush().then(() => { flushed = true })
    await settle()
    expect(requests.map(r => r.value)).toEqual([4])
    expect(flushed).toBe(false)
    requests[0]!.resolve()
    await flushing
    expect(flushed).toBe(true)
    vi.useRealTimers()
  })

  it('cancel stops a send that was still waiting', async () => {
    const { requests, sender } = setup()
    sender.set(1, 4, 1)
    await sender.cancel(1)
    await vi.advanceTimersByTimeAsync(DELAY * 2)
    expect(requests).toHaveLength(0)
    await sender.flush()
    vi.useRealTimers()
  })

  it('a change made during a request is sent after it, once its own wait is over', async () => {
    const { requests, sender } = setup()
    sender.set(1, 2, 1)
    await vi.advanceTimersByTimeAsync(DELAY)
    sender.set(1, 5, 1) // while "2" is in flight
    requests[0]!.resolve()
    await settle()
    expect(requests.map(r => r.value)).toEqual([2]) // "5" still waits for its timer
    await vi.advanceTimersByTimeAsync(DELAY)
    expect(requests.map(r => r.value)).toEqual([2, 5])
    requests[1]!.resolve()
    await sender.flush()
    vi.useRealTimers()
  })

  it('a change whose wait ended during a request is sent as soon as it answers', async () => {
    const { requests, sender } = setup()
    sender.set(1, 2, 1)
    await vi.advanceTimersByTimeAsync(DELAY)
    sender.set(1, 7, 1)
    await vi.advanceTimersByTimeAsync(DELAY) // the wait is over, "2" still in flight
    expect(requests.map(r => r.value)).toEqual([2])
    requests[0]!.resolve()
    await settle()
    expect(requests.map(r => r.value)).toEqual([2, 7])
    requests[1]!.resolve()
    await sender.flush()
    vi.useRealTimers()
  })

  it('sends changes to two lines made within one wait', async () => {
    const { requests, sender } = setup()
    sender.set(1, 3, 1)
    sender.set(2, 9, 1)
    await vi.advanceTimersByTimeAsync(DELAY)
    expect(requests.map(r => [r.key, r.value])).toEqual([[1, 3], [2, 9]])
    requests.forEach(r => r.resolve())
    await sender.flush()
    vi.useRealTimers()
  })

  it('a failure reports the confirmed value and drops a change still waiting', async () => {
    const { requests, onError, sender } = setup()
    sender.set(1, 2, 1)
    await vi.advanceTimersByTimeAsync(DELAY)
    sender.set(1, 3, 1)
    requests[0]!.reject(new Error('429'))
    await vi.advanceTimersByTimeAsync(DELAY * 2)
    expect(onError).toHaveBeenCalledWith(1, 1, expect.any(Error))
    expect(requests.map(r => r.value)).toEqual([2])
    await sender.flush()
    vi.useRealTimers()
  })
})

describe('flush with keepalive', () => {
  it('marks the waiting values it sends, and only those', async () => {
    vi.useFakeTimers()
    const sent: Array<{ key: number; value: number; keepalive: boolean }> = []
    const sender = createLatestWinsSender(
      async (key: number, value: number, { keepalive }: { keepalive: boolean }) => { sent.push({ key, value, keepalive }) },
      vi.fn(),
      { delayMs: 300 }
    )
    sender.set(1, 2, 1)
    await sender.flush({ keepalive: true }) // e.g. the page is being closed
    sender.set(1, 3, 2)
    await vi.advanceTimersByTimeAsync(300)
    await sender.flush()
    expect(sent).toEqual([{ key: 1, value: 2, keepalive: true }, { key: 1, value: 3, keepalive: false }])
    vi.useRealTimers()
  })
})
