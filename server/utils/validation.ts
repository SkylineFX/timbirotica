import type { H3Event } from 'h3'
import type { z } from 'zod'

/**
 * Read the JSON body and validate it with a zod schema.
 *
 * On failure, throw a 400 whose message is the first validation issue, which is
 * the Romanian text written in the schema. Use this instead of
 * `readValidatedBody(event, schema.parse)`: that returns the whole zod issue
 * list as a JSON string, which the UI then shows to the customer.
 */
export async function readBodyWithSchema<S extends z.ZodType>(
  event: H3Event,
  schema: S
): Promise<z.output<S>> {
  const result = schema.safeParse(await readBody(event))
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0]?.message || 'Date invalide.'
    })
  }
  return result.data
}
