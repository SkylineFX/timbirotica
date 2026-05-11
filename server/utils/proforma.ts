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
  page.drawText('PROFORMĂ', { x: margin, y: y - 18, size: 20, font: fontBold, color: black })
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
  drawHeading('CLIENT', customerX, y)

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

  // Items table — A4 with 36pt margins. Columns mirror the printed proforma sample.
  const colIdx = { x: margin, width: 22, align: 'left' as const }
  const colName = { x: margin + 22, width: 210, align: 'left' as const }
  const colUm = { x: margin + 232, width: 38, align: 'center' as const }
  const colQty = { x: margin + 270, width: 38, align: 'center' as const }
  const colPrice = { x: margin + 308, width: 65, align: 'right' as const }
  const colValue = { x: margin + 373, width: 70, align: 'right' as const }
  const colVat = { x: margin + 443, width: 80, align: 'right' as const }

  // Header — two lines (label + "Lei" sub-label for currency columns)
  const headerHeight = 28
  page.drawRectangle({ x: margin, y: y - headerHeight, width: width - margin * 2, height: headerHeight, color: lightGrey })
  const headerLabelY = y - 11
  const headerSubY = y - 22
  drawCell(page, '#', colIdx.x, headerLabelY, colIdx.width, fontBold, 9, black, colIdx.align)
  drawCell(page, 'Denumire', colName.x, headerLabelY, colName.width, fontBold, 9, black, colName.align)
  drawCell(page, 'U.M.', colUm.x, headerLabelY, colUm.width, fontBold, 9, black, colUm.align)
  drawCell(page, 'Cant.', colQty.x, headerLabelY, colQty.width, fontBold, 9, black, colQty.align)
  drawCell(page, 'Preț fără TVA', colPrice.x, headerLabelY, colPrice.width, fontBold, 9, black, colPrice.align)
  drawCell(page, 'Valoare', colValue.x, headerLabelY, colValue.width, fontBold, 9, black, colValue.align)
  drawCell(page, 'Valoare TVA', colVat.x, headerLabelY, colVat.width, fontBold, 9, black, colVat.align)
  drawCell(page, 'Lei', colPrice.x, headerSubY, colPrice.width, font, 8, grey, colPrice.align)
  drawCell(page, 'Lei', colValue.x, headerSubY, colValue.width, font, 8, grey, colValue.align)
  drawCell(page, 'Lei', colVat.x, headerSubY, colVat.width, font, 8, grey, colVat.align)
  y -= headerHeight + 4

  // Rows — generous vertical breathing room, thin separator after each
  const vatMul = 1 + VAT_RATE / 100
  let subtotalNet = 0
  let subtotalVat = 0

  const drawRow = (cells: { idx: string; name: string; qty: string; unitNet: number; lineNet: number; lineVat: number }) => {
    const nameLines = wrapText(cells.name, font, 10, colName.width - 4)
    const contentTop = y - 12
    drawCell(page, cells.idx, colIdx.x, contentTop, colIdx.width, font, 10, black, colIdx.align)
    nameLines.forEach((ln, i) => {
      drawCell(page, ln, colName.x, contentTop - i * 12, colName.width, font, 10, black, colName.align)
    })
    drawCell(page, 'BUC', colUm.x, contentTop, colUm.width, font, 10, black, colUm.align)
    drawCell(page, cells.qty, colQty.x, contentTop, colQty.width, font, 10, black, colQty.align)
    drawCell(page, ronFmt.format(cells.unitNet), colPrice.x, contentTop, colPrice.width, font, 10, black, colPrice.align)
    drawCell(page, ronFmt.format(cells.lineNet), colValue.x, contentTop, colValue.width, font, 10, black, colValue.align)
    drawCell(page, ronFmt.format(cells.lineVat), colVat.x, contentTop, colVat.width, font, 10, black, colVat.align)
    const rowHeight = Math.max(28, nameLines.length * 12 + 16)
    y -= rowHeight
    page.drawLine({ start: { x: margin, y: y + 2 }, end: { x: width - margin, y: y + 2 }, thickness: 0.3, color: lightGrey })
  }

  input.items.forEach((it, idx) => {
    const lineGross = it.priceAtBuy * it.quantity
    const lineNet = lineGross / vatMul
    const lineVat = lineGross - lineNet
    const unitNet = it.priceAtBuy / vatMul
    subtotalNet += lineNet
    subtotalVat += lineVat
    drawRow({
      idx: String(idx + 1),
      name: it.name,
      qty: String(it.quantity),
      unitNet,
      lineNet,
      lineVat,
    })
  })

  // Shipping line
  const shippingGross = input.shippingCost
  const shippingNet = shippingGross / vatMul
  const shippingVat = shippingGross - shippingNet
  if (shippingGross > 0) {
    subtotalNet += shippingNet
    subtotalVat += shippingVat
    drawRow({
      idx: '',
      name: 'Transport',
      qty: '1',
      unitNet: shippingNet,
      lineNet: shippingNet,
      lineVat: shippingVat,
    })
  }

  // "Total" row — values aligned with their columns
  y -= 8
  const totalLabelX = colValue.x - 6
  const totalLabelWidth = fontBold.widthOfTextAtSize('Total', 10)
  page.drawText('Total', { x: totalLabelX - totalLabelWidth, y, size: 10, font: fontBold, color: black })
  drawCell(page, ronFmt.format(subtotalNet), colValue.x, y, colValue.width, fontBold, 10, black, colValue.align)
  drawCell(page, ronFmt.format(subtotalVat), colVat.x, y, colVat.width, fontBold, 10, black, colVat.align)
  y -= 20

  // Highlighted "Total proforma" bar
  const tpBarHeight = 26
  page.drawRectangle({ x: margin, y: y - tpBarHeight, width: width - margin * 2, height: tpBarHeight, color: lightGrey })
  const tpLabel = 'Total proformă'
  const tpValue = fmtRon(input.total)
  page.drawText(tpLabel, { x: margin + 10, y: y - 17, size: 11, font: fontBold, color: black })
  const tpValueWidth = fontBold.widthOfTextAtSize(tpValue, 13)
  page.drawText(tpValue, { x: width - margin - 10 - tpValueWidth, y: y - 18, size: 13, font: fontBold, color: black })

  // === Footer (anchored to the bottom of the page) ===
  drawFooter(page, width, margin, font, fontBold, grey, black, lightGrey, {
    payment: paymentLabel(input.paymentMethod),
    shipping: shippingLabel(input.shippingMethod),
  })

  return await pdfDoc.save()
}

function drawFooter(
  page: PDFPage,
  width: number,
  margin: number,
  font: PDFFont,
  fontBold: PDFFont,
  grey: ReturnType<typeof rgb>,
  black: ReturnType<typeof rgb>,
  lightGrey: ReturnType<typeof rgb>,
  meta: { payment: string; shipping: string }
) {
  let fy = 130
  page.drawText(`Modalitate de plată: ${meta.payment}`, { x: margin, y: fy, size: 9, font, color: black })
  fy -= 12
  page.drawText(`Modalitate de livrare: ${meta.shipping}`, { x: margin, y: fy, size: 9, font, color: black })
  fy -= 16

  const disclaimer = 'Acest document este o factură proformă și nu reprezintă document fiscal. Factura fiscală va fi emisă la livrarea/încasarea comenzii.'
  const disclaimerLines = wrapText(disclaimer, font, 8, width - margin * 2)
  for (const ln of disclaimerLines) {
    page.drawText(ln, { x: margin, y: fy, size: 8, font, color: grey })
    fy -= 10
  }
  fy -= 6
  page.drawLine({ start: { x: margin, y: fy }, end: { x: width - margin, y: fy }, thickness: 0.5, color: lightGrey })
  fy -= 14

  // Company strip — name + contact
  page.drawText(COMPANY.name, { x: margin, y: fy, size: 9, font: fontBold, color: black })
  const telText = `Tel: ${COMPANY.phone}`
  const emailText = `Email: ${COMPANY.email}`
  page.drawText(emailText, { x: width - margin - font.widthOfTextAtSize(emailText, 9), y: fy, size: 9, font, color: grey })
  page.drawText(telText, { x: width - margin - font.widthOfTextAtSize(emailText, 9) - 12 - font.widthOfTextAtSize(telText, 9), y: fy, size: 9, font, color: grey })
  fy -= 12

  // Bank info
  const ibanText = `Cont: ${COMPANY.iban}`
  const bankText = `Banca: ${COMPANY.bankName}`
  page.drawText(ibanText, { x: margin, y: fy, size: 9, font, color: grey })
  page.drawText(bankText, { x: width - margin - font.widthOfTextAtSize(bankText, 9), y: fy, size: 9, font, color: grey })
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
