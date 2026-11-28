/**
 * What a failed $fetch tells the shop. ofetch throws a FetchError whose
 * `statusCode` is the HTTP status and whose `data` is the response body: for
 * an h3 createError, `{ message, data }`.
 */
export interface FetchFailure {
  /** False when no answer came at all: a timeout or a dropped connection. */
  answered: boolean
  /** The HTTP status, when the server answered. */
  status?: number
  /** The message the server sent (createError's `message`), if any. */
  message?: string
  /** The extra data the server sent (createError's `data`), or {}. */
  data: Record<string, unknown>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/**
 * Reads a caught error without `any`. Anything that isn't a FetchError, such
 * as a TypeError from the page's own code, reads as a failure with no answer.
 */
export function fetchFailure(error: unknown): FetchFailure {
  if (!isRecord(error)) return { answered: false, data: {} }
  const body = isRecord(error.data) ? error.data : {}
  return {
    answered: error.response !== undefined && error.response !== null,
    status: typeof error.statusCode === 'number' ? error.statusCode : undefined,
    message: typeof body.message === 'string' && body.message !== '' ? body.message : undefined,
    data: isRecord(body.data) ? body.data : {}
  }
}
