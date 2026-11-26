import { describe, it, expect } from 'vitest'
import { fetchFailure } from '~~/shared/utils/fetchFailure'

describe('fetchFailure', () => {
  it('reads the status, message and data of an error response', () => {
    const error = {
      statusCode: 429,
      response: {},
      data: { message: 'Prea multe cereri.', data: { retryAfter: 60 } }
    }
    expect(fetchFailure(error)).toEqual({
      answered: true,
      status: 429,
      message: 'Prea multe cereri.',
      data: { retryAfter: 60 }
    })
  })

  it('reports no answer for a timeout or a dropped connection', () => {
    expect(fetchFailure({ name: 'FetchError', message: 'timeout' })).toEqual({
      answered: false,
      status: undefined,
      message: undefined,
      data: {}
    })
  })

  it('leaves out a message or data of the wrong kind', () => {
    const failure = fetchFailure({ statusCode: 500, response: {}, data: { message: '', data: 'x' } })
    expect(failure.message).toBeUndefined()
    expect(failure.data).toEqual({})
  })

  it('reads anything that is not an object as a failure with no answer', () => {
    for (const error of [undefined, null, 'error', 42]) {
      expect(fetchFailure(error)).toEqual({ answered: false, data: {} })
    }
  })
})
