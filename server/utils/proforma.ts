import { PDFDocument, rgb, type PDFFont, type PDFPage, type StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { COMPANY } from './company'
import { formatAmount, formatRon, formatShopDate } from '~~/shared/utils/format'
import { fromBani, splitGross, toBani, vatBreakdown } from '~~/shared/utils/money'

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
  hasRo?: boolean | null
  onrc?: string | null
  bankName?: string | null
  iban?: string | null
  phone?: string | null
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
      onrc: billingSnapshot.onrc ?? undefined,
      iban: billingSnapshot.iban ?? undefined,
      bankName: billingSnapshot.bankName ?? undefined,
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

function parseSnapshot<T>(json: string | null | undefined): T | null {
  if (!json) return null
  try {
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

/**
 * The proforma customer of a saved order, read from its address snapshots.
 *
 * The billing snapshot holds whoever the invoice is for: the company, the other
 * personal address picked under "Persoana fizica", or a copy of the delivery
 * address. A missing or empty billing snapshot falls back to the delivery one.
 * Used by the proforma downloads so they match the proforma emailed with the order.
 */
export function proformaCustomerFromSnapshots(
  billingSnapshotJson: string | null | undefined,
  shippingSnapshotJson: string | null | undefined,
  user: { firstName: string; lastName: string }
): ProformaInput['customer'] {
  const billing = parseSnapshot<BillingSnapshot & ShippingSnapshot>(billingSnapshotJson)
  const shipping = parseSnapshot<ShippingSnapshot>(shippingSnapshotJson)
  return resolveProformaCustomer(
    billing?.companyName ? billing : null,
    billing?.street ? billing : shipping,
    user
  )
}

function paymentLabel(method: string): string {
  if (method === 'transfer') return 'Transfer bancar'
  if (method === 'cash') return 'Numerar la livrare'
  return method
}

function shippingLabel(method: string): string {
  if (method === 'courier') return 'Livrare prin curier'
  if (method === 'pickup') return 'Ridicare personala'
  return method
}

// --- Fonts ---

/** Font data for the proforma: TrueType bytes, or one of pdf-lib's built-in fonts. */
export interface ProformaFonts {
  regular: Uint8Array | StandardFonts
  bold: Uint8Array | StandardFonts
}

const FONT_CDN_BASE = 'https://cdn.timbirotica.ro/fonts'
let cachedFonts: ProformaFonts | null = null

async function loadFonts(): Promise<ProformaFonts> {
  // Fonts live on the R2 CDN instead of being bundled into the Worker — keeps
  // the bundle ~2 MiB smaller. Cold-start cost is one parallel fetch (~50ms);
  // subsequent requests in the same isolate reuse the cache below.
  if (cachedFonts) return cachedFonts
  const [regularRes, boldRes] = await Promise.all([
    fetch(`${FONT_CDN_BASE}/DejaVuSans-Regular.ttf`),
    fetch(`${FONT_CDN_BASE}/DejaVuSans-Bold.ttf`),
  ])
  if (!regularRes.ok || !boldRes.ok) {
    throw new Error(`Failed to fetch DejaVuSans fonts from CDN (regular: ${regularRes.status}, bold: ${boldRes.status})`)
  }
  const [regular, bold] = await Promise.all([regularRes.arrayBuffer(), boldRes.arrayBuffer()])
  cachedFonts = { regular: new Uint8Array(regular), bold: new Uint8Array(bold) }
  return cachedFonts
}

// --- Page layout (A4, in points) ---

const PAGE_SIZE: [number, number] = [595.28, 841.89]
const MARGIN = 36

// The footer (payment, disclaimer, company and bank details) is drawn on every
// page, starting at FOOTER_TOP. Table rows and the totals must end above
// ROWS_BOTTOM so they never run into it.
const FOOTER_TOP = 130
const ROWS_BOTTOM = FOOTER_TOP + 20

const TABLE_HEADER_HEIGHT = 28
const TABLE_HEADER_GAP = 4
const CONTINUATION_HEADER_HEIGHT = 28
// The "Total" row and the highlighted total bar, drawn under the last row.
const TOTALS_HEIGHT = 8 + 20 + 26

const BLACK = rgb(0, 0, 0)
const GREY = rgb(0.45, 0.45, 0.45)
const LIGHT_GREY = rgb(0.92, 0.92, 0.92)

interface Column { x: number; width: number; align: 'left' | 'right' | 'center' }

// Item table columns, mirroring the printed proforma sample.
const COLUMNS = {
  idx: { x: MARGIN, width: 22, align: 'left' },
  name: { x: MARGIN + 22, width: 194, align: 'left' },
  um: { x: MARGIN + 216, width: 38, align: 'center' },
  qty: { x: MARGIN + 254, width: 38, align: 'center' },
  price: { x: MARGIN + 308, width: 65, align: 'right' },
  value: { x: MARGIN + 373, width: 70, align: 'right' },
  vat: { x: MARGIN + 443, width: 80, align: 'right' },
} satisfies Record<string, Column>

const NAME_FONT_SIZE = 10
const NAME_LINE_HEIGHT = 12

/** Height of a table row whose product name wraps to `nameLineCount` lines. */
const rowHeight = (nameLineCount: number) => Math.max(28, nameLineCount * NAME_LINE_HEIGHT + 16)

interface TableRow {
  idx: string
  nameLines: string[]
  qty: string
  unitNet: number
  lineNet: number
  lineVat: number
}

export interface Fonts {
  font: PDFFont
  fontBold: PDFFont
}

// --- Pagination ---

export interface PaginationSpace {
  /** Height available for rows on the first page. */
  firstPage: number
  /** Height available for rows on each later page. */
  otherPages: number
  /** Height the totals block needs under the last row. */
  totals: number
}

/**
 * Split the table rows over pages and return the row indexes on each page, in
 * order. A row is never split across pages. The totals block must fit under
 * the last row: when it doesn't, the last row moves to a new page together
 * with the totals, so the totals are not left alone on a page. A row taller
 * than a whole page gets a page of its own.
 */
export function paginateRows(rowHeights: readonly number[], space: PaginationSpace): number[][] {
  const capacity = (pageIndex: number) => (pageIndex === 0 ? space.firstPage : space.otherPages)
  const pages: number[][] = [[]]
  let used = 0

  rowHeights.forEach((height, index) => {
    const page = pages[pages.length - 1]!
    if (page.length > 0 && used + height > capacity(pages.length - 1)) {
      pages.push([index])
      used = height
    } else {
      page.push(index)
      used += height
    }
  })

  if (used + space.totals > capacity(pages.length - 1)) {
    const lastPage = pages[pages.length - 1]!
    pages.push(lastPage.length > 1 ? [lastPage.pop()!] : [])
  }

  return pages
}

// --- PDF generation ---

/**
 * Generate the proforma PDF. Page 1 has the full header with the supplier and
 * customer details; when the items don't fit, later pages repeat a short
 * header and the table header. The footer is on every page, and the totals
 * come after the last row.
 *
 * `fontLoader` is replaceable so tests can use pdf-lib's built-in fonts
 * instead of downloading DejaVu Sans from the CDN.
 */
export async function generateProformaPdf(
  input: ProformaInput,
  fontLoader: () => Promise<ProformaFonts> = loadFonts
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  const fontData = await fontLoader()
  const fonts: Fonts = {
    font: await pdfDoc.embedFont(fontData.regular, { subset: true }),
    fontBold: await pdfDoc.embedFont(fontData.bold, { subset: true }),
  }

  const { rows, net: subtotalNet, vat: subtotalVat } = buildRows(input, fonts.font)

  const firstPage = pdfDoc.addPage(PAGE_SIZE)
  const firstRowsTop = drawTableHeader(firstPage, fonts, drawFirstPageHeader(firstPage, fonts, input))
  const otherRowsTop = PAGE_SIZE[1] - MARGIN - CONTINUATION_HEADER_HEIGHT - TABLE_HEADER_HEIGHT - TABLE_HEADER_GAP

  const pagePlan = paginateRows(rows.map(row => rowHeight(row.nameLines.length)), {
    firstPage: firstRowsTop - ROWS_BOTTOM,
    otherPages: otherRowsTop - ROWS_BOTTOM,
    totals: TOTALS_HEIGHT,
  })

  const footer = { payment: paymentLabel(input.paymentMethod), shipping: shippingLabel(input.shippingMethod) }

  pagePlan.forEach((rowIndexes, pageIndex) => {
    const page = pageIndex === 0 ? firstPage : pdfDoc.addPage(PAGE_SIZE)
    let y = pageIndex === 0
      ? firstRowsTop
      : drawTableHeader(page, fonts, drawContinuationHeader(page, fonts, input))

    for (const rowIndex of rowIndexes) {
      y = drawRow(page, fonts, rows[rowIndex]!, y)
    }
    if (pageIndex === pagePlan.length - 1) {
      drawTotals(page, fonts, y, subtotalNet, subtotalVat, input.total)
    }
    drawFooter(page, fonts, footer)
    if (pagePlan.length > 1) {
      drawPageNumber(page, fonts, pageIndex + 1, pagePlan.length)
    }
  })

  return await pdfDoc.save()
}

/**
 * The table rows and the totals of the Net and VAT columns, in lei. The
 * amounts come from vatBreakdown: each line is split in whole bani and the
 * totals add up the printed lines, so the columns add up to the Total row and
 * net plus VAT is the order total.
 */
function buildRows(input: ProformaInput, font: PDFFont): { rows: TableRow[], net: number, vat: number } {
  const nameWidth = COLUMNS.name.width - 4
  const breakdown = vatBreakdown(
    input.items.map(item => ({ price: item.priceAtBuy, quantity: item.quantity })),
    input.shippingCost
  )

  const rows: TableRow[] = input.items.map((item, index) => ({
    idx: String(index + 1),
    nameLines: wrapText(item.name, font, NAME_FONT_SIZE, nameWidth),
    qty: String(item.quantity),
    unitNet: fromBani(splitGross(toBani(item.priceAtBuy)).net),
    lineNet: fromBani(breakdown.rows[index]!.net),
    lineVat: fromBani(breakdown.rows[index]!.vat)
  }))

  if (breakdown.shipping) {
    rows.push({
      idx: '',
      nameLines: ['Transport'],
      qty: '1',
      unitNet: fromBani(breakdown.shipping.net),
      lineNet: fromBani(breakdown.shipping.net),
      lineVat: fromBani(breakdown.shipping.vat)
    })
  }

  return { rows, net: fromBani(breakdown.net), vat: fromBani(breakdown.vat) }
}

/** Title, reference, supplier and customer. Returns the y where the item table starts. */
function drawFirstPageHeader(page: PDFPage, { font, fontBold }: Fonts, input: ProformaInput): number {
  const { width, height } = page.getSize()
  let y = height - MARGIN

  page.drawText('PROFORMA', { x: MARGIN, y: y - 18, size: 20, font: fontBold, color: BLACK })
  const refLabel = `Nr. ${input.orderNumber}`
  page.drawText(refLabel, { x: width - MARGIN - fontBold.widthOfTextAtSize(refLabel, 12), y: y - 8, size: 12, font: fontBold, color: BLACK })
  const dateText = `Data: ${formatShopDate(input.orderDate)}`
  page.drawText(dateText, { x: width - MARGIN - font.widthOfTextAtSize(dateText, 10), y: y - 24, size: 10, font, color: GREY })

  y -= 50
  drawDivider(page, y)
  y -= 16

  // Supplier + Customer blocks (two columns)
  const colWidth = (width - MARGIN * 2 - 20) / 2
  const supplierX = MARGIN
  const customerX = MARGIN + colWidth + 20

  page.drawText('FURNIZOR', { x: supplierX, y, size: 10, font: fontBold, color: GREY })
  page.drawText('CLIENT', { x: customerX, y, size: 10, font: fontBold, color: GREY })

  const supplierLines: InfoLine[] = [
    { value: COMPANY.name },
    { label: 'CIF', value: COMPANY.cui },
    { label: 'Reg. Com.', value: COMPANY.onrc },
    { label: 'Adresa', value: COMPANY.address },
    { label: 'IBAN', value: COMPANY.iban },
    { label: 'Banca', value: COMPANY.bankName }
  ]

  const customerLines: InfoLine[] = [{ value: input.customer.name }]
  if (input.customer.type === 'company') {
    if (input.customer.cui) customerLines.push({ label: 'CIF', value: input.customer.cui })
    if (input.customer.onrc) customerLines.push({ label: 'Reg. Com.', value: input.customer.onrc })
  }
  // Address + locality as one wrapped block, mirroring the FURNIZOR column layout
  const locality = [input.customer.city, input.customer.county].filter(v => v && v !== '—').join(', ')
  const addressBlock = [
    input.customer.address && input.customer.address !== '—' ? input.customer.address : null,
    locality || null,
  ].filter(Boolean).join(', ')
  if (addressBlock) customerLines.push({ value: addressBlock })
  if (input.customer.type === 'company') {
    if (input.customer.iban) customerLines.push({ label: 'IBAN', value: input.customer.iban })
    if (input.customer.bankName) customerLines.push({ label: 'Banca', value: input.customer.bankName })
  }

  const supplierEnd = drawInfoLines(page, { font, fontBold }, layoutInfoLines(supplierLines, { font, fontBold }, colWidth), supplierX, y - 14)
  const customerEnd = drawInfoLines(page, { font, fontBold }, layoutInfoLines(customerLines, { font, fontBold }, colWidth), customerX, y - 14)
  y = Math.min(supplierEnd, customerEnd) - 10

  drawDivider(page, y)
  return y - 16
}

/** Short header for pages after the first. Returns the y where the item table starts. */
function drawContinuationHeader(page: PDFPage, { font, fontBold }: Fonts, input: ProformaInput): number {
  const { width, height } = page.getSize()
  const top = height - MARGIN

  const title = `PROFORMA Nr. ${input.orderNumber}`
  page.drawText(title, { x: MARGIN, y: top - 12, size: 12, font: fontBold, color: BLACK })
  const dateText = `Data: ${formatShopDate(input.orderDate)}`
  page.drawText(dateText, { x: width - MARGIN - font.widthOfTextAtSize(dateText, 10), y: top - 12, size: 10, font, color: GREY })

  return top - CONTINUATION_HEADER_HEIGHT
}

/** Grey header row of the item table. Returns the y where the first row starts. */
function drawTableHeader(page: PDFPage, { font, fontBold }: Fonts, y: number): number {
  const { width } = page.getSize()
  page.drawRectangle({ x: MARGIN, y: y - TABLE_HEADER_HEIGHT, width: width - MARGIN * 2, height: TABLE_HEADER_HEIGHT, color: LIGHT_GREY })

  // Two lines: the label, plus a "Lei" sub-label for the currency columns
  const labelY = y - 11
  const subLabelY = y - 22
  drawCell(page, '#', COLUMNS.idx, labelY, fontBold, 9, BLACK)
  drawCell(page, 'Denumire', COLUMNS.name, labelY, fontBold, 9, BLACK)
  drawCell(page, 'U.M.', COLUMNS.um, labelY, fontBold, 9, BLACK)
  drawCell(page, 'Cant.', COLUMNS.qty, labelY, fontBold, 9, BLACK)
  drawCell(page, 'Pret fara TVA', COLUMNS.price, labelY, fontBold, 9, BLACK)
  drawCell(page, 'Valoare', COLUMNS.value, labelY, fontBold, 9, BLACK)
  drawCell(page, 'Valoare TVA', COLUMNS.vat, labelY, fontBold, 9, BLACK)
  drawCell(page, 'Lei', COLUMNS.price, subLabelY, font, 8, GREY)
  drawCell(page, 'Lei', COLUMNS.value, subLabelY, font, 8, GREY)
  drawCell(page, 'Lei', COLUMNS.vat, subLabelY, font, 8, GREY)

  return y - TABLE_HEADER_HEIGHT - TABLE_HEADER_GAP
}

/** One item row with a thin separator under it. Returns the y where the next row starts. */
function drawRow(page: PDFPage, { font }: Fonts, row: TableRow, y: number): number {
  const { width } = page.getSize()
  const contentTop = y - 12

  drawCell(page, row.idx, COLUMNS.idx, contentTop, font, 10, BLACK)
  row.nameLines.forEach((line, i) => {
    drawCell(page, line, COLUMNS.name, contentTop - i * NAME_LINE_HEIGHT, font, NAME_FONT_SIZE, BLACK)
  })
  drawCell(page, 'BUC', COLUMNS.um, contentTop, font, 10, BLACK)
  drawCell(page, row.qty, COLUMNS.qty, contentTop, font, 10, BLACK)
  drawCell(page, formatAmount(row.unitNet), COLUMNS.price, contentTop, font, 10, BLACK)
  drawCell(page, formatAmount(row.lineNet), COLUMNS.value, contentTop, font, 10, BLACK)
  drawCell(page, formatAmount(row.lineVat), COLUMNS.vat, contentTop, font, 10, BLACK)

  const bottom = y - rowHeight(row.nameLines.length)
  page.drawLine({ start: { x: MARGIN, y: bottom + 2 }, end: { x: width - MARGIN, y: bottom + 2 }, thickness: 0.3, color: LIGHT_GREY })
  return bottom
}

/** The "Total" row (net and VAT sums) and the highlighted total bar. Uses TOTALS_HEIGHT below `y`. */
function drawTotals(page: PDFPage, { fontBold }: Fonts, y: number, subtotalNet: number, subtotalVat: number, total: number) {
  const { width } = page.getSize()

  y -= 8
  const totalLabelX = COLUMNS.value.x - 6
  page.drawText('Total', { x: totalLabelX - fontBold.widthOfTextAtSize('Total', 10), y, size: 10, font: fontBold, color: BLACK })
  drawCell(page, formatAmount(subtotalNet), COLUMNS.value, y, fontBold, 10, BLACK)
  drawCell(page, formatAmount(subtotalVat), COLUMNS.vat, y, fontBold, 10, BLACK)
  y -= 20

  const barHeight = 26
  page.drawRectangle({ x: MARGIN, y: y - barHeight, width: width - MARGIN * 2, height: barHeight, color: LIGHT_GREY })
  page.drawText('Total', { x: MARGIN + 10, y: y - 17, size: 11, font: fontBold, color: BLACK })
  const totalText = formatRon(total)
  page.drawText(totalText, { x: width - MARGIN - 10 - fontBold.widthOfTextAtSize(totalText, 13), y: y - 18, size: 13, font: fontBold, color: BLACK })
}

/** Payment and delivery method, disclaimer, company and bank details, anchored to the bottom. */
function drawFooter(page: PDFPage, { font, fontBold }: Fonts, meta: { payment: string; shipping: string }) {
  const { width } = page.getSize()
  let fy = FOOTER_TOP
  page.drawText(`Modalitate de plata: ${meta.payment}`, { x: MARGIN, y: fy, size: 9, font, color: BLACK })
  fy -= 12
  page.drawText(`Modalitate de livrare: ${meta.shipping}`, { x: MARGIN, y: fy, size: 9, font, color: BLACK })
  fy -= 16

  const disclaimer = 'Acest document este o factura proforma si nu reprezinta document fiscal. Factura fiscala va fi emisa la livrarea/incasarea comenzii.'
  for (const line of wrapText(disclaimer, font, 8, width - MARGIN * 2)) {
    page.drawText(line, { x: MARGIN, y: fy, size: 8, font, color: GREY })
    fy -= 10
  }
  fy -= 6
  page.drawLine({ start: { x: MARGIN, y: fy }, end: { x: width - MARGIN, y: fy }, thickness: 0.5, color: LIGHT_GREY })
  fy -= 14

  // Company strip — name + contact
  page.drawText(COMPANY.name, { x: MARGIN, y: fy, size: 9, font: fontBold, color: BLACK })
  const telText = `Tel: ${COMPANY.phone}`
  const emailText = `Email: ${COMPANY.email}`
  page.drawText(emailText, { x: width - MARGIN - font.widthOfTextAtSize(emailText, 9), y: fy, size: 9, font, color: GREY })
  page.drawText(telText, { x: width - MARGIN - font.widthOfTextAtSize(emailText, 9) - 12 - font.widthOfTextAtSize(telText, 9), y: fy, size: 9, font, color: GREY })
  fy -= 12

  // Bank info
  const ibanText = `Cont: ${COMPANY.iban}`
  const bankText = `Banca: ${COMPANY.bankName}`
  page.drawText(ibanText, { x: MARGIN, y: fy, size: 9, font, color: GREY })
  page.drawText(bankText, { x: width - MARGIN - font.widthOfTextAtSize(bankText, 9), y: fy, size: 9, font, color: GREY })
}

function drawPageNumber(page: PDFPage, { font }: Fonts, pageNumber: number, pageCount: number) {
  const { width } = page.getSize()
  const text = `Pagina ${pageNumber} din ${pageCount}`
  page.drawText(text, { x: (width - font.widthOfTextAtSize(text, 8)) / 2, y: 22, size: 8, font, color: GREY })
}

function drawDivider(page: PDFPage, y: number) {
  const { width } = page.getSize()
  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 0.8, color: LIGHT_GREY })
}

/** One line of the supplier or customer block: an optional label in regular type, the value in bold. */
export interface InfoLine {
  label?: string
  value: string
}

export interface InfoLineLayout {
  /** "CIF: ", or '' for a line without a label. */
  label: string
  labelWidth: number
  /** The value wrapped to the column, measured in the bold font it is drawn in. */
  valueLines: string[]
}

const INFO_FONT_SIZE = 10

/**
 * The most lines one value may take. Real names, addresses and bank names
 * fit in 2 or 3; the stored fields have no length limit, and an endless one
 * would push the item table off the first page, so it is cut with "…".
 */
export const INFO_MAX_LINES_PER_VALUE = 4

/**
 * Wraps each value to the space after its label, measured in bold, so no line
 * runs past the column (a long bank name used to run off the page). Lines
 * after the first are drawn under the value, not under the label.
 */
export function layoutInfoLines(lines: InfoLine[], { font, fontBold }: Fonts, maxWidth: number): InfoLineLayout[] {
  return lines.map(({ label, value }) => {
    const labelText = label ? `${label}: ` : ''
    const labelWidth = labelText ? font.widthOfTextAtSize(labelText, INFO_FONT_SIZE) : 0
    const width = maxWidth - labelWidth
    const wrapped = wrapText(value, fontBold, INFO_FONT_SIZE, width)
    if (wrapped.length <= INFO_MAX_LINES_PER_VALUE) return { label: labelText, labelWidth, valueLines: wrapped }
    // Cut: the last kept line ends with "…", shortened until it fits.
    const kept = wrapped.slice(0, INFO_MAX_LINES_PER_VALUE)
    let last = kept[kept.length - 1]!
    while (last && fontBold.widthOfTextAtSize(`${last}…`, INFO_FONT_SIZE) > width) last = last.slice(0, -1).trimEnd()
    kept[kept.length - 1] = `${last}…`
    return { label: labelText, labelWidth, valueLines: kept }
  })
}

/**
 * Draws laid-out lines 12pt apart: each label in regular type, its value lines
 * in bold under one another. Returns the y under the last line.
 */
function drawInfoLines(page: PDFPage, { font, fontBold }: Fonts, lines: InfoLineLayout[], x: number, yStart: number): number {
  const lineHeight = 12
  let y = yStart
  for (const { label, labelWidth, valueLines } of lines) {
    if (label) page.drawText(label, { x, y, size: INFO_FONT_SIZE, font, color: BLACK })
    for (const text of valueLines) {
      page.drawText(text, { x: x + labelWidth, y, size: INFO_FONT_SIZE, font: fontBold, color: BLACK })
      y -= lineHeight
    }
  }
  return y
}

function drawCell(page: PDFPage, text: string, column: Column, y: number, font: PDFFont, size: number, color: ReturnType<typeof rgb>) {
  const w = font.widthOfTextAtSize(text, size)
  let x = column.x + 2
  if (column.align === 'right') x = column.x + column.width - w - 2
  else if (column.align === 'center') x = column.x + (column.width - w) / 2
  page.drawText(text, { x, y, size, font, color })
}

/** Wrap text to a width. A word longer than the width is broken across lines. */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean).flatMap(word => breakLongWord(word, font, size, maxWidth))
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : [text]
}

function breakLongWord(word: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (font.widthOfTextAtSize(word, size) <= maxWidth) return [word]
  const parts: string[] = []
  let current = ''
  for (const char of word) {
    if (current && font.widthOfTextAtSize(current + char, size) > maxWidth) {
      parts.push(current)
      current = char
    } else {
      current += char
    }
  }
  if (current) parts.push(current)
  return parts
}
