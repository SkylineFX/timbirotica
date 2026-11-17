import { describe, it, expect } from 'vitest'
import { splitIntoChunks } from '~~/shared/utils/chunk'

describe('splitIntoChunks', () => {
  it('splits a list into chunks of the given size, keeping the order', () => {
    expect(splitIntoChunks([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  it('returns one chunk when the list fits', () => {
    expect(splitIntoChunks([1, 2], 5)).toEqual([[1, 2]])
  })

  it('returns no chunks for an empty list', () => {
    expect(splitIntoChunks([], 3)).toEqual([])
  })

  it('rejects a chunk size that is not a positive whole number', () => {
    expect(() => splitIntoChunks([1], 0)).toThrow()
    expect(() => splitIntoChunks([1], 1.5)).toThrow()
  })
})
