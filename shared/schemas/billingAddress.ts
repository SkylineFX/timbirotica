import { z } from 'zod'

const CUI_REGEX = /^\d{2,10}$/
const ONRC_REGEX = /^[JFC]\d{1,2}\/\d{1,6}\/\d{4}$/
const IBAN_REGEX = /^RO\d{2}[A-Z0-9]{20}$/

export const billingAddressSchema = z.object({
  companyName: z.string().min(2, 'Numele firmei este prea scurt'),
  cui: z.string().regex(CUI_REGEX, 'CUI invalid'),
  hasRo: z.boolean().optional(),
  onrc: z.string().regex(ONRC_REGEX, 'Format invalid'),
  bankName: z.string().min(2, 'Numele băncii este prea scurt').optional().or(z.literal('')),
  iban: z.string()
    .transform(v => v.replace(/\s+/g, '').toUpperCase())
    .refine(v => v === '' || IBAN_REGEX.test(v), {
      message: 'IBAN invalid'
    })
    .optional()
    .or(z.literal('')),
  street: z.string().min(5, 'Adresa trebuie să aibă minim 5 caractere'),
  city: z.string().min(2, 'Selectează localitatea'),
  county: z.string().min(2, 'Selectează județul'),
  isDefaultBilling: z.boolean().optional(),
})

export type BillingAddress = z.infer<typeof billingAddressSchema>
