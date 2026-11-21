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
