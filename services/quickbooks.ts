// QuickBooks Online Integration Service
// Used for invoice and billing sync with STC's accounting system
// Requires QuickBooks OAuth 2.0 — placeholder implementation

interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

interface QBInvoice {
  customerId: string
  invoiceNumber: string
  date: string
  dueDate: string
  lineItems: InvoiceLineItem[]
  total: number
  notes?: string
}

const QB_BASE_URL = 'https://quickbooks.api.intuit.com/v3/company'

// Placeholder credentials — configure in Admin > Integration Settings
const QB_CONFIG = {
  clientId: process.env.QB_CLIENT_ID || '',
  clientSecret: process.env.QB_CLIENT_SECRET || '',
  realmId: process.env.QB_REALM_ID || '',
  accessToken: process.env.QB_ACCESS_TOKEN || '',
  refreshToken: process.env.QB_REFRESH_TOKEN || '',
}

function isConfigured(): boolean {
  return Boolean(QB_CONFIG.clientId && QB_CONFIG.realmId && QB_CONFIG.accessToken)
}

export async function createInvoice(invoice: QBInvoice): Promise<{ id: string; docNumber: string } | null> {
  if (!isConfigured()) {
    console.log('[QuickBooks] Not configured — invoice creation skipped:', invoice.invoiceNumber)
    return null
  }

  const response = await fetch(`${QB_BASE_URL}/${QB_CONFIG.realmId}/invoice`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${QB_CONFIG.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      CustomerRef: { value: invoice.customerId },
      DocNumber: invoice.invoiceNumber,
      TxnDate: invoice.date,
      DueDate: invoice.dueDate,
      PrivateNote: invoice.notes || '',
      Line: invoice.lineItems.map((item, i) => ({
        LineNum: i + 1,
        Description: item.description,
        Amount: item.amount,
        DetailType: 'SalesItemLineDetail',
        SalesItemLineDetail: {
          Qty: item.quantity,
          UnitPrice: item.unitPrice,
        },
      })),
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`QuickBooks invoice creation failed: ${error}`)
  }

  const data = await response.json()
  return {
    id: data.Invoice.Id,
    docNumber: data.Invoice.DocNumber,
  }
}

export async function syncClientBilling(params: {
  orderId: string
  orderCode: string
  clientId: string
  clientName: string
  items: Array<{ description: string; qty: number; unitPrice: number }>
}): Promise<void> {
  if (!isConfigured()) {
    console.log('[QuickBooks] Not configured — billing sync skipped for order:', params.orderCode)
    return
  }

  const lineItems: InvoiceLineItem[] = params.items.map(item => ({
    description: item.description,
    quantity: item.qty,
    unitPrice: item.unitPrice,
    amount: item.qty * item.unitPrice,
  }))

  const total = lineItems.reduce((sum, item) => sum + item.amount, 0)

  await createInvoice({
    customerId: params.clientId,
    invoiceNumber: `WMS-${params.orderCode}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    lineItems,
    total,
    notes: `WMS Order ${params.orderId} — ${params.clientName}`,
  })
}

export function getQBConnectionStatus(): { configured: boolean; realmId: string | null } {
  return {
    configured: isConfigured(),
    realmId: QB_CONFIG.realmId || null,
  }
}
