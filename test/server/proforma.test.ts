import { describe, it, expect } from 'vitest'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { generateProformaPdf, INFO_MAX_LINES_PER_VALUE, layoutInfoLines, paginateRows, proformaCustomerFromSnapshots, type PaginationSpace, type ProformaInput } from '~~/server/utils/proforma'

describe('paginateRows', () => {
  const space: PaginationSpace = { firstPage: 100, otherPages: 200, totals: 30 }

  it('keeps everything on one page when it fits', () => {
    expect(paginateRows([20, 20, 20], space)).toEqual([[0, 1, 2]])
  })

  it('moves the rows that do not fit to the next page', () => {
    // page 1 holds 40 + 40; the third row would need 120 of its 100
    expect(paginateRows([40, 40, 40, 40], space)).toEqual([[0, 1], [2, 3]])
  })

  it('uses the larger space of the pages after the first', () => {
    // page 1: 2 rows of 40 (80 of 100); page 2: 5 rows of 40 (200 of 200);
    // the last page holds the rest plus the totals (3 x 40 + 30 = 150 of 200)
    expect(paginateRows(Array(10).fill(40), space)).toEqual([[0, 1], [2, 3, 4, 5, 6], [7, 8, 9]])
  })

  it('moves the last row to a new page when the totals do not fit under it', () => {
    // 40 + 40 fit on page 1 (80 of 100), but the totals would need 30 more
    expect(paginateRows([40, 40], space)).toEqual([[0], [1]])
  })

  it('gives the totals their own page only when one row fills the page', () => {
    expect(paginateRows([90], space)).toEqual([[0], []])
  })

  it('puts a row taller than a page on a page of its own', () => {
    expect(paginateRows([20, 150, 20], { firstPage: 100, otherPages: 120, totals: 10 })).toEqual([[0], [1], [2]])
  })

  it('places every row exactly once, in order, within the space of its page', () => {
    // Deterministic pseudo-random heights between 28 and 64 (1 to 4 name lines)
    const heights = Array.from({ length: 500 }, (_, i) => 28 + ((i * 37) % 4) * 12)
    const pages = paginateRows(heights, { firstPage: 430, otherPages: 650, totals: 54 })

    expect(pages.flat()).toEqual(heights.map((_, i) => i))
    pages.forEach((rows, pageIndex) => {
      const capacity = pageIndex === 0 ? 430 : 650
      const used = rows.reduce((sum, i) => sum + heights[i]!, 0)
      const totals = pageIndex === pages.length - 1 ? 54 : 0
      expect(used + totals).toBeLessThanOrEqual(capacity)
    })
  })
})

describe('generateProformaPdf', () => {
  // pdf-lib's built-in fonts, so the test needs no font download.
  const builtInFonts = async () => ({ regular: StandardFonts.Helvetica, bold: StandardFonts.HelveticaBold })

  const proforma = (itemCount: number, name = (i: number) => `PRODUS DE TEST NUMARUL ${i + 1} HARTIE COPIATOR A4 80G 500 COLI`): ProformaInput => ({
    orderNumber: 'TEST0001',
    orderDate: new Date('2026-11-17T10:00:00Z'),
    paymentMethod: 'transfer',
    shippingMethod: 'courier',
    shippingCost: 30,
    total: itemCount * 2 * 19.99 + 30,
    items: Array.from({ length: itemCount }, (_, i) => ({ name: name(i), quantity: 2, priceAtBuy: 19.99 })),
    customer: {
      type: 'company', name: 'Client Test SRL', cui: 'RO123456', onrc: 'J40/1234/2024',
      address: 'Strada Exemplu 1', city: 'Bucuresti', county: 'Bucuresti',
    },
  })

  const pageCount = async (input: ProformaInput) =>
    (await PDFDocument.load(await generateProformaPdf(input, builtInFonts))).getPageCount()

  it('fits a short order on one page', async () => {
    expect(await pageCount(proforma(5))).toBe(1)
  })

  it('spreads a long order over several pages', async () => {
    expect(await pageCount(proforma(40))).toBeGreaterThan(1)
  })

  it('adds pages as the order grows', async () => {
    const counts = [await pageCount(proforma(40)), await pageCount(proforma(120)), await pageCount(proforma(300))]
    expect(counts[1]).toBeGreaterThan(counts[0]!)
    expect(counts[2]).toBeGreaterThan(counts[1]!)
  })

  it('handles a product name with a word longer than the name column', async () => {
    const longWord = 'X'.repeat(80)
    expect(await pageCount(proforma(3, () => `PRODUS ${longWord} TEST`))).toBe(1)
  })
})

describe('layoutInfoLines', () => {
  // The column width of the supplier and customer blocks on an A4 page.
  const COLUMN = (595.28 - 40 * 2 - 20) / 2

  const fonts = async () => {
    const doc = await PDFDocument.create()
    return { font: await doc.embedFont(StandardFonts.Helvetica), fontBold: await doc.embedFont(StandardFonts.HelveticaBold) }
  }

  it('wraps a long bank name instead of letting it run off the page (M11)', async () => {
    const f = await fonts()
    const [bank] = layoutInfoLines([{ label: 'Banca', value: 'BANCA COMERCIALA ROMANA S.A. - SUCURSALA SECTOR 6 BUCURESTI' }], f, COLUMN)
    expect(bank!.label).toBe('Banca: ')
    expect(bank!.valueLines.length).toBeGreaterThan(1)
    for (const line of bank!.valueLines) {
      expect(bank!.labelWidth + f.fontBold.widthOfTextAtSize(line, 10)).toBeLessThanOrEqual(COLUMN)
    }
  })

  it('cuts an endless value at a few lines, so the item table keeps its place on the first page', async () => {
    const f = await fonts()
    const [bank] = layoutInfoLines([{ label: 'Banca', value: 'BANCA FOARTE LUNGA '.repeat(200) }], f, COLUMN)
    expect(bank!.valueLines).toHaveLength(INFO_MAX_LINES_PER_VALUE)
    expect(bank!.valueLines.at(-1)!.endsWith('…')).toBe(true)
    for (const line of bank!.valueLines) {
      expect(bank!.labelWidth + f.fontBold.widthOfTextAtSize(line, 10)).toBeLessThanOrEqual(COLUMN)
    }
  })

  it('measures values in the bold font they are drawn in, and keeps ": " inside a value (M11)', async () => {
    const f = await fonts()
    const address = 'Strada Drumul Taberei Nr. 92, Bl: A1, Sc: 2, Ap: 14, Sector 6, Bucuresti, Romania'
    const layout = layoutInfoLines([{ label: 'Adresa', value: address }, { value: address }], f, COLUMN)
    for (const { labelWidth, valueLines } of layout) {
      for (const line of valueLines) {
        expect(labelWidth + f.fontBold.widthOfTextAtSize(line, 10)).toBeLessThanOrEqual(COLUMN)
      }
      expect(valueLines.join(' ')).toBe(address)
    }
    expect(layout[1]!.label).toBe('')
  })
})

describe('proformaCustomerFromSnapshots', () => {
  const user = { firstName: 'Cont', lastName: 'Client' }
  const home = { firstName: 'Ion', lastName: 'Popescu', street: 'Strada Livrarii 1', city: 'Sector 1', county: 'Bucuresti', phone: '0700000001' }
  const otherAddress = { firstName: 'Ana', lastName: 'Ionescu', street: 'Strada Facturii 2', city: 'Cluj-Napoca', county: 'Cluj', phone: '0700000002' }
  const company = { companyName: 'Firma SRL', cui: '123456', hasRo: true, onrc: 'J40/1/2020', iban: 'RO49AAAA1B31007593840000', bankName: 'Banca', street: 'Bulevardul Firmei 3', city: 'Sector 2', county: 'Bucuresti' }
  const json = (v: unknown) => JSON.stringify(v)

  it('bills an individual to the other address picked at checkout, not the delivery address', () => {
    expect(proformaCustomerFromSnapshots(json(otherAddress), json(home), user)).toEqual({
      type: 'individual', name: 'Ana Ionescu', address: 'Strada Facturii 2', city: 'Cluj-Napoca', county: 'Cluj',
    })
  })

  it('bills an individual to the delivery address when billing copies it', () => {
    expect(proformaCustomerFromSnapshots(json(home), json(home), user)).toMatchObject({ type: 'individual', name: 'Ion Popescu', address: 'Strada Livrarii 1' })
  })

  it('bills a company, also for a pickup order without a delivery address', () => {
    expect(proformaCustomerFromSnapshots(json(company), '{}', user)).toMatchObject({ type: 'company', name: 'Firma SRL', cui: 'RO123456', address: 'Bulevardul Firmei 3' })
  })

  it('falls back to the delivery address when the billing snapshot is missing, empty or unreadable', () => {
    for (const billing of [null, '{}', 'not json']) {
      expect(proformaCustomerFromSnapshots(billing, json(home), user)).toMatchObject({ name: 'Ion Popescu', address: 'Strada Livrarii 1' })
    }
  })
})
