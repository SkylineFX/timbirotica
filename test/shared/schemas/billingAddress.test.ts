import { describe, it, expect } from 'vitest'
import { billingAddressSchema } from '~~/shared/schemas/billingAddress'

const validCompany = {
  companyName: 'Acme SRL',
  cui: '12345678',
  phone: '0721 234 567',
  street: 'Strada Exemplu 10',
  city: 'Cluj-Napoca',
  county: 'Cluj',
}

describe('billingAddressSchema', () => {
  it('accepts a valid company billing record', () => {
    expect(billingAddressSchema.safeParse(validCompany).success).toBe(true)
  })

  it('requires a company name of at least 2 characters', () => {
    expect(billingAddressSchema.safeParse({ ...validCompany, companyName: 'A' }).success).toBe(false)
  })

  it('strips spaces from the CUI and accepts digits only', () => {
    const res = billingAddressSchema.safeParse({ ...validCompany, cui: '12 34 56' })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.cui).toBe('123456')
  })

  it('rejects a CUI containing the RO prefix or other letters', () => {
    expect(billingAddressSchema.safeParse({ ...validCompany, cui: 'RO123' }).success).toBe(false)
  })

  it('accepts both the legacy and the 13-digit ONRC formats', () => {
    expect(billingAddressSchema.safeParse({ ...validCompany, onrc: 'J40/1234/2024' }).success).toBe(true)
    expect(billingAddressSchema.safeParse({ ...validCompany, onrc: 'J2024000001005' }).success).toBe(true)
    expect(billingAddressSchema.safeParse({ ...validCompany, onrc: '' }).success).toBe(true)
  })

  it('rejects a malformed ONRC', () => {
    expect(billingAddressSchema.safeParse({ ...validCompany, onrc: 'X40/1/2024' }).success).toBe(false)
  })

  it('normalises the IBAN (strip spaces + uppercase) and validates the RO format', () => {
    const res = billingAddressSchema.safeParse({ ...validCompany, iban: 'ro49 aaaa 1b31 0075 9384 0000' })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.iban).toBe('RO49AAAA1B31007593840000')
  })

  it('treats the IBAN as optional but rejects an invalid one', () => {
    expect(billingAddressSchema.safeParse({ ...validCompany, iban: '' }).success).toBe(true)
    expect(billingAddressSchema.safeParse({ ...validCompany, iban: 'RO49' }).success).toBe(false)
  })

  it('strips spaces from the phone before validating', () => {
    const res = billingAddressSchema.safeParse(validCompany)
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.phone).toBe('0721234567')
  })
})
