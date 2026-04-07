import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  })
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  // In development without SMTP config, log to console
  if (!process.env.SMTP_HOST) {
    console.log('[Email Service] SMTP not configured. Email would be sent to:', options.to)
    console.log('[Email Service] Subject:', options.subject)
    return
  }

  const transporter = createTransport()

  await transporter.sendMail({
    from: `"STC Logistics WMS" <${process.env.SMTP_USER || 'noreply@shipstc.com'}>`,
    to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments,
  })
}

export async function sendOrderReadyNotification(params: {
  orderId: string
  orderCode: string
  warehouse: string
  client: string
  recipients: string[]
}): Promise<void> {
  await sendEmail({
    to: params.recipients,
    subject: `[STC WMS] Order ${params.orderCode} Ready for Pickup`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a2744; color: white; padding: 20px;">
          <h1 style="margin: 0; font-size: 24px;">STC Logistics</h1>
          <p style="margin: 5px 0 0; opacity: 0.8;">Warehouse Management System</p>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #1a2744;">Order Ready for Pickup</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Order ID:</td>
              <td style="padding: 8px 0;">${params.orderId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Client:</td>
              <td style="padding: 8px 0;">${params.client}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Warehouse:</td>
              <td style="padding: 8px 0;">${params.warehouse}</td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 15px; background: #d4edda; border-left: 4px solid #28a745; border-radius: 4px;">
            <strong>Order ${params.orderCode} is ready for pickup at ${params.warehouse}.</strong>
            <p>Pack list and Bill of Lading have been generated and are available in the WMS.</p>
          </div>
        </div>
        <div style="padding: 15px; background: #e9ecef; text-align: center; font-size: 12px; color: #666;">
          STC Logistics WMS — Automated Notification
        </div>
      </div>
    `,
  })
}

export async function sendLowStockAlert(params: {
  skuCode: string
  skuDescription: string
  warehouse: string
  available: number
  threshold: number
  recipients: string[]
}): Promise<void> {
  await sendEmail({
    to: params.recipients,
    subject: `[STC WMS] Low Stock Alert: ${params.skuCode} at ${params.warehouse}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <div style="background: #1a2744; color: white; padding: 20px;">
          <h1>STC Logistics — Low Stock Alert</h1>
        </div>
        <div style="padding: 20px;">
          <p>SKU <strong>${params.skuCode}</strong> (${params.skuDescription}) at ${params.warehouse} has fallen below the low-stock threshold.</p>
          <p>Available: <strong>${params.available}</strong> units (Threshold: ${params.threshold})</p>
        </div>
      </div>
    `,
  })
}

export async function sendDiscrepancyAlert(params: {
  receiptCode: string
  skuCode: string
  discrepancyType: string
  warehouse: string
  recipients: string[]
}): Promise<void> {
  await sendEmail({
    to: params.recipients,
    subject: `[STC WMS] Receiving Discrepancy: ${params.receiptCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <div style="background: #dc3545; color: white; padding: 20px;">
          <h1>STC Logistics — Receiving Discrepancy</h1>
        </div>
        <div style="padding: 20px;">
          <p>A receiving discrepancy has been logged at <strong>${params.warehouse}</strong>.</p>
          <p>Receipt: <strong>${params.receiptCode}</strong></p>
          <p>SKU: <strong>${params.skuCode}</strong></p>
          <p>Type: <strong>${params.discrepancyType}</strong></p>
        </div>
      </div>
    `,
  })
}

export async function sendUnexpectedPackageAlert(params: {
  packageCode: string
  warehouse: string
  recipients: string[]
}): Promise<void> {
  await sendEmail({
    to: params.recipients,
    subject: `[STC WMS] Unexpected Package Quarantined: ${params.packageCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <div style="background: #f4811f; color: white; padding: 20px;">
          <h1>STC Logistics — Unexpected Package Alert</h1>
        </div>
        <div style="padding: 20px;">
          <p>An unexpected package has been received and quarantined at <strong>${params.warehouse}</strong>.</p>
          <p>Package Code: <strong>${params.packageCode}</strong></p>
          <p>STC approval required to link this package to a project.</p>
        </div>
      </div>
    `,
  })
}
