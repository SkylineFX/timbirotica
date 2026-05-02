import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { COMPANY, VAT_RATE } from './company'

export interface ProformaInput {
  orderNumber: string
  orderDate: Date
  paymentMethod: string
  shippingMethod: string
  shippingCost: number
  total: number
  items: Array<{ name: string; quantity: number; priceAtBuy: number }>
  customer: {
    type: 'individual' | 'company'
    name: string
    cui?: string
    onrc?: string
    iban?: string
    bankName?: string
    address: string
    city: string
    county: string
  }
}

export interface BillingSnapshot {
  companyName?: string
  cui?: string
  hasRo?: boolean
  onrc?: string
  bankName?: string
  iban?: string
  street?: string
  city?: string
  county?: string
}

export interface ShippingSnapshot {
  firstName?: string
  lastName?: string
  street?: string
  city?: string
  county?: string
  phone?: string
}

export function resolveProformaCustomer(
  billingSnapshot: BillingSnapshot | null,
  shippingSnapshot: ShippingSnapshot | null,
  user: { firstName: string; lastName: string }
): ProformaInput['customer'] {
  if (billingSnapshot?.companyName && billingSnapshot?.cui) {
    return {
      type: 'company',
      name: billingSnapshot.companyName,
      cui: (billingSnapshot.hasRo ? 'RO' : '') + billingSnapshot.cui,
      onrc: billingSnapshot.onrc,
      iban: billingSnapshot.iban,
      bankName: billingSnapshot.bankName,
      address: billingSnapshot.street ?? '—',
      city: billingSnapshot.city ?? '—',
      county: billingSnapshot.county ?? '—',
    }
  }
  const src = shippingSnapshot ?? {}
  return {
    type: 'individual',
    name: `${src.firstName ?? user.firstName} ${src.lastName ?? user.lastName}`.trim() || user.firstName,
    address: src.street ?? '—',
    city: src.city ?? '—',
    county: src.county ?? '—',
  }
}

const ronFmt = new Intl.NumberFormat('ro-RO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function fmtRon(n: number): string {
  return `${ronFmt.format(n)} RON`
}

function fmtDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

function paymentLabel(method: string): string {
  if (method === 'transfer') return 'Transfer bancar (OP)'
  if (method === 'cash') return 'Numerar la livrare'
  return method
}

function shippingLabel(method: string): string {
  if (method === 'courier') return 'Curier rapid'
  if (method === 'pickup') return 'Ridicare personală'
  return method
}

let cachedFonts: { regular: Uint8Array; bold: Uint8Array } | null = null

async function loadFonts(): Promise<{ regular: Uint8Array; bold: Uint8Array }> {
  if (cachedFonts) return cachedFonts
  const storage = useStorage('assets:server')
  const regular = await storage.getItemRaw('fonts/DejaVuSans-Regular.ttf')
  const bold = await storage.getItemRaw('fonts/DejaVuSans-Bold.ttf')
  if (!regular || !bold) {
    throw new Error('Font files missing in server/assets/fonts')
  }
  const toU8 = (buf: unknown): Uint8Array => {
    if (buf instanceof Uint8Array) return buf
    if (buf instanceof ArrayBuffer) return new Uint8Array(buf)
    throw new Error('Unexpected font asset type')
  }
  cachedFonts = { regular: toU8(regular), bold: toU8(bold) }
  return cachedFonts
}

export async function generateProformaPdf(input: ProformaInput): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  const fonts = await loadFonts()
  const font = await pdfDoc.embedFont(fonts.regular, { subset: true })
  const fontBold = await pdfDoc.embedFont(fonts.bold, { subset: true })

  const page = pdfDoc.addPage([595.28, 841.89])
  const { width, height } = page.getSize()
  const margin = 36
  const black = rgb(0, 0, 0)
  const grey = rgb(0.45, 0.45, 0.45)
  const lightGrey = rgb(0.92, 0.92, 0.92)

  let y = height - margin

  // Header — title + reference
  page.drawText('FACTURĂ PROFORMĂ', { x: margin, y: y - 18, size: 20, font: fontBold, color: black })
  const refLabel = `Nr. ${input.orderNumber}`
  const refDate = fmtDate(input.orderDate)
  page.drawText(refLabel, { x: width - margin - fontBold.widthOfTextAtSize(refLabel, 12), y: y - 8, size: 12, font: fontBold, color: black })
  const dateText = `Data: ${refDate}`
  page.drawText(dateText, { x: width - margin - font.widthOfTextAtSize(dateText, 10), y: y - 24, size: 10, font, color: grey })

  y -= 50

  // Divider
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.8, color: lightGrey })
  y -= 16

  // Supplier + Customer blocks (two columns)
  const colWidth = (width - margin * 2 - 20) / 2
  const supplierX = margin
  const customerX = margin + colWidth + 20

  const drawHeading = (text: string, x: number, yPos: number) => {
    page.drawText(text, { x, y: yPos, size: 10, font: fontBold, color: grey })
  }
  const drawLines = (lines: string[], x: number, yStart: number, lineHeight = 12, size = 10): number => {
    let yy = yStart
    for (const ln of lines) {
      page.drawText(ln, { x, y: yy, size, font, color: black })
      yy -= lineHeight
    }
    return yy
  }

  drawHeading('FURNIZOR', supplierX, y)
  drawHeading(input.customer.type === 'company' ? 'CUMPĂRĂTOR' : 'CLIENT', customerX, y)

  const supplierLines = [
    COMPANY.name,
    `CUI: ${COMPANY.cui}`,
    `ONRC: ${COMPANY.onrc}`,
    ...wrapText(`Sediu: ${COMPANY.address}`, font, 10, colWidth),
    `Tel: ${COMPANY.phone}`,
    `Email: ${COMPANY.email}`,
  ]

  const customerLines: string[] = [input.customer.name]
  if (input.customer.type === 'company') {
    if (input.customer.cui) customerLines.push(`CUI: ${input.customer.cui}`)
    if (input.customer.onrc) customerLines.push(`ONRC: ${input.customer.onrc}`)
    if (input.customer.iban) customerLines.push(`IBAN: ${input.customer.iban}`)
    if (input.customer.bankName) customerLines.push(`Banca: ${input.customer.bankName}`)
  }
  if (input.customer.address && input.customer.address !== '—') {
    customerLines.push(...wrapText(input.customer.address, font, 10, colWidth))
  }
  const locality = [input.customer.city, input.customer.county].filter(v => v && v !== '—').join(', ')
  if (locality) customerLines.push(locality)

  const supplierEnd = drawLines(supplierLines, supplierX, y - 14)
  const customerEnd = drawLines(customerLines, customerX, y - 14)
  y = Math.min(supplierEnd, customerEnd) - 10

  // Divider
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.8, color: lightGrey })
  y -= 16

  // Items table — A4 with 36pt margins.
  const colIdx   = { x: margin,        width: 22,  align: 'left'  as const }
  const colName  = { x: margin + 22,   width: 200, align: 'left'  as const }
  const colQty   = { x: margin + 222,  width: 36,  align: 'right' as const }
  const colUnit  = { x: margin + 258,  width: 70,  align: 'right' as const }
  const colNet   = { x: margin + 328,  width: 70,  align: 'right' as const }
  const colVat   = { x: margin + 398,  width: 50,  align: 'right' as const }
  const colGross = { x: margin + 448,  width: 75,  align: 'right' as const }

  // Header row
  page.drawRectangle({ x: margin, y: y - 14, width: width - margin * 2, height: 18, color: lightGrey })
  drawCell(page, 'Nr.',           colIdx.x,   y - 4, colIdx.width,   fontBold, 9, black, colIdx.align)
  drawCell(page, 'Denumire',      colName.x,  y - 4, colName.width,  fontBold, 9, black, colName.align)
  drawCell(page, 'Cant.',         colQty.x,   y - 4, colQty.width,   fontBold, 9, black, colQty.align)
  drawCell(page, 'P.U. fără TVA', colUnit.x,  y - 4, colUnit.width,  fontBold, 9, black, colUnit.align)
  drawCell(page, 'Val. fără TVA', colNet.x,   y - 4, colNet.width,   fontBold, 9, black, colNet.align)
  drawCell(page, 'TVA',           colVat.x,   y - 4, colVat.width,   fontBold, 9, black, colVat.align)
  drawCell(page, 'Val. cu TVA',   colGross.x, y - 4, colGross.width, fontBold, 9, black, colGross.align)
  y -= 22

  // Rows
  const vatMul = 1 + VAT_RATE / 100
  let subtotalNet = 0
  let subtotalVat = 0

  input.items.forEach((it, idx) => {
    const lineGross = it.priceAtBuy * it.quantity
    const lineNet = lineGross / vatMul
    const lineVat = lineGross - lineNet
    const unitNet = it.priceAtBuy / vatMul

    subtotalNet += lineNet
    subtotalVat += lineVat

    // Wrap product name if needed
    const nameLines = wrapText(it.name, font, 9, colName.width - 4)
    const rowHeight = Math.max(14, nameLines.length * 11 + 4)

    drawCell(page, String(idx + 1),          colIdx.x,   y, colIdx.width,   font, 9, black, colIdx.align)
    nameLines.forEach((ln, i) => {
      drawCell(page, ln,                     colName.x,  y - i * 11, colName.width, font, 9, black, colName.align)
    })
    drawCell(page, String(it.quantity),      colQty.x,   y, colQty.width,   font, 9, black, colQty.align)
    drawCell(page, ronFmt.format(unitNet),   colUnit.x,  y, colUnit.width,  font, 9, black, colUnit.align)
    drawCell(page, ronFmt.format(lineNet),   colNet.x,   y, colNet.width,   font, 9, black, colNet.align)
    drawCell(page, `${VAT_RATE}%`,           colVat.x,   y, colVat.width,   font, 9, black, colVat.align)
    drawCell(page, ronFmt.format(lineGross), colGross.x, y, colGross.width, font, 9, black, colGross.align)

    y -= rowHeight
    page.drawLine({ start: { x: margin, y: y + 4 }, end: { x: width - margin, y: y + 4 }, thickness: 0.3, color: lightGrey })
  })

  // Shipping line (if any)
  const shippingGross = input.shippingCost
  const shippingNet = shippingGross / vatMul
  const shippingVat = shippingGross - shippingNet
  if (shippingGross > 0) {
    subtotalNet += shippingNet
    subtotalVat += shippingVat
    drawCell(page, '',                           colIdx.x,   y, colIdx.width,   font, 9, black, colIdx.align)
    drawCell(page, 'Transport',                  colName.x,  y, colName.width,  font, 9, black, colName.align)
    drawCell(page, '1',                          colQty.x,   y, colQty.width,   font, 9, black, colQty.align)
    drawCell(page, ronFmt.format(shippingNet),   colUnit.x,  y, colUnit.width,  font, 9, black, colUnit.align)
    drawCell(page, ronFmt.format(shippingNet),   colNet.x,   y, colNet.width,   font, 9, black, colNet.align)
    drawCell(page, `${VAT_RATE}%`,               colVat.x,   y, colVat.width,   font, 9, black, colVat.align)
    drawCell(page, ronFmt.format(shippingGross), colGross.x, y, colGross.width, font, 9, black, colGross.align)
    y -= 14
    page.drawLine({ start: { x: margin, y: y + 4 }, end: { x: width - margin, y: y + 4 }, thickness: 0.3, color: lightGrey })
  }

  y -= 12

  // Totals block (right-aligned)
  const totalsX = width - margin - 220
  const valuesX = width - margin
  const drawTotalRow = (label: string, value: string, bold = false) => {
    const f = bold ? fontBold : font
    page.drawText(label, { x: totalsX, y, size: 10, font: f, color: black })
    const valWidth = f.widthOfTextAtSize(value, 10)
    page.drawText(value, { x: valuesX - valWidth, y, size: 10, font: f, color: black })
    y -= 14
  }
  drawTotalRow('Total fără TVA', fmtRon(subtotalNet))
  drawTotalRow(`TVA (${VAT_RATE}%)`, fmtRon(subtotalVat))
  y -= 4
  drawTotalRow('Total de plată', fmtRon(input.total), true)

  y -= 16

  // Payment / shipping summary
  page.drawText(`Modalitate de plată: ${paymentLabel(input.paymentMethod)}`, { x: margin, y, size: 9, font, color: black })
  y -= 12
  page.drawText(`Modalitate de livrare: ${shippingLabel(input.shippingMethod)}`, { x: margin, y, size: 9, font, color: black })
  y -= 24

  // Disclaimer (mandatory)
  const disclaimer = 'Acest document este o factură proformă și nu reprezintă document fiscal. Factura fiscală va fi emisă la livrarea/încasarea comenzii.'
  const disclaimerLines = wrapText(disclaimer, fontBold, 9, width - margin * 2)
  for (const ln of disclaimerLines) {
    page.drawText(ln, { x: margin, y, size: 9, font: fontBold, color: black })
    y -= 12
  }

  return await pdfDoc.save()
}

function drawCell(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  width: number,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
  align: 'left' | 'right' | 'center'
) {
  const w = font.widthOfTextAtSize(text, size)
  let drawX = x + 2
  if (align === 'right') drawX = x + width - w - 2
  else if (align === 'center') drawX = x + (width - w) / 2
  page.drawText(text, { x: drawX, y, size, font, color })
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = w
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : [text]
}
