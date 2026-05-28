import { Resend } from 'resend'
import * as Sentry from '@sentry/nuxt'

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
  customerPhone?: string
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
    from: 'Timbirotica <comenzi@timbirotica.ro>',
    to: data.customerEmail,
    subject: `Confirmare înregistrare comandă #${data.orderNumber}`,
    html: htmlContent,
    attachments: data.attachment ? [{
      filename: data.attachment.filename,
      content: Buffer.from(data.attachment.content)
    }] : undefined
  })

  if (error) {
    console.error('Resend API Error:', { statusCode: error.statusCode, name: error.name, message: error.message })
    throw new Error(error.message)
  }

  console.log(`Order confirmation email sent to ${data.customerEmail} for order ${data.orderNumber}`)
}

export async function sendEmailVerification(data: { email: string; firstName: string; verifyLink: string }): Promise<void> {
  const config = useRuntimeConfig()

  if (!config.resendApiKey) {
    console.warn('RESEND_API_KEY is not set. Skipping email dispatch.')
    return
  }

  const resend = new Resend(config.resendApiKey)

  const template = await renderEmailComponent('EmailVerification', {
    firstName: data.firstName,
    verifyLink: data.verifyLink
  })

  const htmlContent = typeof template === 'string' ? template : template.html

  const { error } = await resend.emails.send({
    from: 'Timbirotica <noreply@timbirotica.ro>',
    to: data.email,
    subject: 'Confirmare adresă email - Timbirotica',
    html: htmlContent
  })

  if (error) {
    console.error('Resend API Error:', { statusCode: error.statusCode, name: error.name, message: error.message })
    throw new Error(error.message)
  }
}

export async function sendNewOrderAdminNotification(data: OrderEmailData): Promise<void> {
  const config = useRuntimeConfig()

  if (!config.resendApiKey) {
    console.warn('RESEND_API_KEY is not set. Skipping email dispatch.')
    return
  }

  const resend = new Resend(config.resendApiKey)

  const template = await renderEmailComponent('OrderAdminNotification', {
    orderNumber: data.orderNumber,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
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
    from: 'Timbirotica <comenzi@timbirotica.ro>',
    to: config.adminEmail,
    replyTo: data.customerEmail, // Admin can reply straight to the customer
    subject: `Comanda noua #${data.orderNumber}`,
    html: htmlContent,
    attachments: data.attachment ? [{
      filename: data.attachment.filename,
      content: Buffer.from(data.attachment.content)
    }] : undefined
  })

  if (error) {
    console.error('Resend API Error:', { statusCode: error.statusCode, name: error.name, message: error.message })
    throw new Error(error.message)
  }

  console.log(`Admin order notification sent to ${config.adminEmail} for order ${data.orderNumber}`)
}

/**
 * Send both order emails (customer confirmation + admin notification) in parallel.
 * Failures of one don't drop the other, and rejections are captured to Sentry
 * (tagged with the orderNumber) so they're never silently swallowed.
 *
 * Intended to be wrapped in `event.waitUntil(...)` by the caller so the serverless
 * runtime doesn't kill the process before sends complete.
 */
export async function dispatchOrderEmails(data: OrderEmailData): Promise<void> {
  const results = await Promise.allSettled([
    sendOrderConfirmation(data),
    sendNewOrderAdminNotification(data)
  ])
  for (const r of results) {
    if (r.status === 'rejected') {
      console.error('Background order email dispatch failed:', r.reason)
      Sentry.captureException(r.reason, { tags: { area: 'order-email', orderNumber: data.orderNumber } })
    }
  }
}

export interface ContactMessageData {
  name: string
  email: string
  subject: string
  message: string
}

export async function sendContactMessage(data: ContactMessageData): Promise<void> {
  const config = useRuntimeConfig()

  if (!config.resendApiKey) {
    console.warn('RESEND_API_KEY is not set. Skipping email dispatch.')
    return
  }

  const resend = new Resend(config.resendApiKey)

  const template = await renderEmailComponent('ContactMessage', {
    name: data.name,
    email: data.email,
    subject: data.subject,
    message: data.message
  })

  const htmlContent = typeof template === 'string' ? template : template.html

  const { error } = await resend.emails.send({
    from: 'Timbirotica <noreply@timbirotica.ro>',
    to: config.adminEmail,
    replyTo: data.email, // Replies go straight to the person who wrote in
    subject: `[Contact] ${data.subject}`,
    html: htmlContent
  })

  if (error) {
    console.error('Resend API Error:', { statusCode: error.statusCode, name: error.name, message: error.message })
    throw new Error(error.message)
  }

  console.log(`Contact message from ${data.email} sent to ${config.adminEmail}`)
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
    from: 'Timbirotica <noreply@timbirotica.ro>',
    to: data.email,
    subject: 'Resetare parolă - Timbirotica',
    html: htmlContent
  })

  if (error) {
    console.error('Resend API Error:', { statusCode: error.statusCode, name: error.name, message: error.message })
    throw new Error(error.message)
  }
}
