import { Resend } from 'resend'

export interface Address {
  fullName: string
  address: string
  city: string
  county: string
  phone: string
}

export interface BillingAddress {
  companyName: string
  cui: string
  onrc: string
  bankName?: string
  iban?: string
  address: string
  city: string
  county: string
}

export interface EmailAttachment {
  filename: string
  content: Uint8Array
}

export interface OrderEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  total: number
  shippingCost: number
  items: Array<{ name: string; quantity: number; price: number }>
  shippingAddress?: Address
  billingAddress?: BillingAddress
  orderDate: string
  paymentMethod: string
  shippingMethod: string
  attachment?: EmailAttachment
}

export async function sendOrderConfirmation(data: OrderEmailData): Promise<void> {
  const config = useRuntimeConfig()

  if (!config.resendApiKey) {
    console.warn('RESEND_API_KEY is not set. Skipping email dispatch.')
    return
  }

  const resend = new Resend(config.resendApiKey)

  const template = await renderEmailComponent('OrderConfirmation', {
    orderNumber: data.orderNumber,
    customerName: data.customerName,
    total: data.total,
    shippingCost: data.shippingCost,
    items: data.items,
    shippingAddress: data.shippingAddress,
    billingAddress: data.billingAddress,
    orderDate: data.orderDate,
    paymentMethod: data.paymentMethod,
    shippingMethod: data.shippingMethod
  })

  const htmlContent = typeof template === 'string' ? template : template.html

  const { error } = await resend.emails.send({
    from: 'Eurotimalex <onboarding@resend.dev>', // Temporary verified domain provided by Resend
    to: data.customerEmail,
    subject: `Confirmare înregistrare comandă #${data.orderNumber}`,
    html: htmlContent,
    attachments: data.attachment ? [{
      filename: data.attachment.filename,
      content: Buffer.from(data.attachment.content)
    }] : undefined
  })

  if (error) {
    console.error('Resend API Error:', error)
    throw new Error(error.message)
  }

  console.log(`Order confirmation email sent to ${data.customerEmail} for order ${data.orderNumber}`)
}

export async function sendPasswordReset(data: { email: string; firstName: string; resetLink: string }): Promise<void> {
  const config = useRuntimeConfig()

  if (!config.resendApiKey) {
    console.warn('RESEND_API_KEY is not set. Skipping email dispatch.')
    return
  }

  const resend = new Resend(config.resendApiKey)

  const template = await renderEmailComponent('ResetPassword', {
    firstName: data.firstName,
    resetLink: data.resetLink
  })

  const htmlContent = typeof template === 'string' ? template : template.html

  const { error } = await resend.emails.send({
    from: 'Eurotimalex <onboarding@resend.dev>',
    to: data.email,
    subject: 'Resetare parolă - Eurotimalex',
    html: htmlContent
  })

  if (error) {
    console.error('Resend API Error:', error)
    throw new Error(error.message)
  }
}
