import { z } from 'zod'

const COUNTIES = ['Bucuresti', 'Ilfov'] as const
const NAME_REGEX = /^[\p{L}\s'-]{2,}$/u
const POSTAL_REGEX = /^\d{6}$/
const FORM_PHONE_REGEX = /^\d{3}\s?\d{3}\s?\d{3}$/   // form input: 9 digits, optional spaces
const PAYLOAD_PHONE_REGEX = /^\+40\d{9}$/             // server: prefixed with +40

// Form-side schema (what AddressForm collects)
export const addressFormSchema = z.object({
  firstName: z.string().regex(NAME_REGEX, 'Prenume prea scurt'),
  lastName: z.string().regex(NAME_REGEX, 'Nume prea scurt'),
  phone: z.string().regex(FORM_PHONE_REGEX, 'Telefonul trebuie sa aiba 9 cifre'),
  county: z.enum(COUNTIES, { message: 'Selecteaza judetul' }),
  city: z.string().min(2, 'Selecteaza localitatea'),
  street: z.string().min(5, 'Adresa trebuie sa aiba minim 5 caractere'),
  postalCode: z.string().regex(POSTAL_REGEX, 'Cod postal invalid'),
  isDefaultShipping: z.boolean().optional(),
})

// Payload-side schema (what the API receives)
export const addressPayloadSchema = addressFormSchema.extend({
  phone: z.string().regex(PAYLOAD_PHONE_REGEX, 'Telefon invalid.'),
})

export type AddressForm = z.infer<typeof addressFormSchema>
export type AddressPayload = z.infer<typeof addressPayloadSchema>
