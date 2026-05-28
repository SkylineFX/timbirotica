import { z } from 'zod'

const CUI_REGEX = /^\d{2,10}$/
const ONRC_REGEX = /^[JFC]\d{1,2}\/\d{1,6}\/\d{4}$/
const IBAN_REGEX = /^RO\d{2}[A-Z0-9]{20}$/
const PAYLOAD_PHONE_REGEX = /^0\d{9}$/  // national format after spaces are stripped

export const billingAddressSchema = z.object({
  companyName: z.string().min(2, 'Numele firmei este prea scurt'),
  cui: z.string().regex(CUI_REGEX, 'CUI invalid'),
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
  city: z.string().min(2, 'Selecteaza localitatea'),
  county: z.string().min(2, 'Selecteaza judetul'),
  isDefaultBilling: z.boolean().optional(),
})

export type BillingAddress = z.infer<typeof billingAddressSchema>
