import { z } from 'zod'
import { isWholeBani } from '~~/shared/utils/money'

/** A product price in lei, VAT included: above 0 and in whole bani (at most two decimals). */
export const productPriceSchema = z
  .number({ error: 'Pret invalid.' })
  .positive('Pretul trebuie sa fie mai mare decat 0.')
  .refine(isWholeBani, 'Pretul poate avea cel mult doua zecimale.')

/** An admin edit of one product: a new price, its availability, or both. */
export const adminProductUpdateSchema = z.object({
  price: productPriceSchema.optional(),
  stock: z.union([z.literal(0), z.literal(1)]).optional()
}).refine(body => body.price !== undefined || body.stock !== undefined, {
  message: 'Trebuie sa trimiti cel putin un camp.'
})
