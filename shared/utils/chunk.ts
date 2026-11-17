/**
 * Split a list into consecutive chunks of at most `size` items, keeping the
 * order. Used to keep each D1 statement within its limit of bound parameters.
 */
export function splitIntoChunks<T>(items: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) {
    throw new Error('Chunk size must be a positive integer.')
  }
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}
