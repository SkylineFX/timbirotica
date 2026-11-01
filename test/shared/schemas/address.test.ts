import { describe, it, expect } from 'vitest'
import { addressFormSchema, addressPayloadSchema } from '~~/shared/schemas/address'

const validForm = {
  firstName: 'Ana',
  lastName: 'Pop',
  phone: '0721 234 567',
  county: 'Cluj',
  city: 'Cluj-Napoca',
  street: 'Strada Exemplu 10',
  postalCode: '',
}

describe('addressFormSchema', () => {
  it('accepts a valid form address', () => {
    expect(addressFormSchema.safeParse(validForm).success).toBe(true)
  })

  it('accepts unicode (diacritic) names', () => {
    expect(addressFormSchema.safeParse({ ...validForm, firstName: 'Ștefan' }).success).toBe(true)
  })

  it('rejects single-character names', () => {
    expect(addressFormSchema.safeParse({ ...validForm, firstName: 'A' }).success).toBe(false)
  })

  it('accepts the phone with or without spaces', () => {
    expect(addressFormSchema.safeParse({ ...validForm, phone: '0721234567' }).success).toBe(true)
    expect(addressFormSchema.safeParse({ ...validForm, phone: '0721 234 567' }).success).toBe(true)
  })

  it('rejects malformed phones', () => {
    expect(addressFormSchema.safeParse({ ...validForm, phone: '+40721234567' }).success).toBe(false)
    expect(addressFormSchema.safeParse({ ...validForm, phone: '12345' }).success).toBe(false)
  })

  it('treats postal code as optional but validates 6 digits when present', () => {
    expect(addressFormSchema.safeParse({ ...validForm, postalCode: '' }).success).toBe(true)
    expect(addressFormSchema.safeParse({ ...validForm, postalCode: '400123' }).success).toBe(true)
    expect(addressFormSchema.safeParse({ ...validForm, postalCode: '12345' }).success).toBe(false)
  })

  it('requires a street of at least 5 characters', () => {
    expect(addressFormSchema.safeParse({ ...validForm, street: 'abcd' }).success).toBe(false)
  })
})

describe('addressPayloadSchema', () => {
  it('requires the space-stripped national phone format', () => {
    expect(addressPayloadSchema.safeParse({ ...validForm, phone: '0721234567' }).success).toBe(true)
    expect(addressPayloadSchema.safeParse({ ...validForm, phone: '0721 234 567' }).success).toBe(false)
  })
})
