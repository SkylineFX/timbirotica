import { z } from 'zod'

const CUI_REGEX = /^\d{2,10}$/
// Accepts both the legacy slashed format (J40/1234/2024 = letter + county +
// sequential + year) and the post-26-July-2024 continuous format (letter + 13
// digits: year4 + sequential6 + county2 + control1, e.g. J2024000001005). Old
// numbers are only converted on request, so both remain in active use.
// Ref: https://www.juridice.ro/753801/noul-format-al-numarului-de-ordine-din-registrul-comertului.html
const ONRC_REGEX = /^[JFC](\d{1,2}\/\d{1,6}\/\d{4}|\d{13})$/
const IBAN_REGEX = /^RO\d{2}[A-Z0-9]{20}$/
const PAYLOAD_PHONE_REGEX = /^0\d{9}$/  // national format after spaces are stripped

export const billingAddressSchema = z.object({
  companyName: z.string().min(2, 'Numele firmei este prea scurt'),
  cui: z.string()
    .transform(v => v.replace(/\s+/g, ''))
    .refine(v => CUI_REGEX.test(v), { message: 'CUI invalid' }),
  hasRo: z.boolean().optional(),
  onrc: z.string().regex(ONRC_REGEX, 'Format invalid').optional().or(z.literal('')),
  bankName: z.string().min(2, 'Numele bancii este prea scurt').optional().or(z.literal('')),
  iban: z.string()
    .transform(v => v.replace(/\s+/g, '').toUpperCase())
    .refine(v => v === '' || IBAN_REGEX.test(v), {
      message: 'IBAN invalid'
    })
    .optional()
    .or(z.literal('')),
  // Mandatory contact phone for this billing record. The user's account phone is
  // only used as a fallback / for prefilling new billing forms.
  phone: z.string()
    .transform(v => v.replace(/\s+/g, ''))
    .refine(v => PAYLOAD_PHONE_REGEX.test(v), {
      message: 'Numar de telefon invalid'
    }),
  street: z.string().min(5, 'Adresa trebuie sa aiba minim 5 caractere'),
  city: z.string({ error: 'Selecteaza localitatea' }).min(2, 'Selecteaza localitatea'),
  county: z.string({ error: 'Selecteaza judetul' }).min(2, 'Selecteaza judetul'),
  isDefaultBilling: z.boolean().optional(),
})

export type BillingAddress = z.infer<typeof billingAddressSchema>
