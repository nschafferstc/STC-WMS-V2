import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

// GET /api/orders/[id]/bol — returns printable HTML Bill of Lading
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const order = await prisma.order.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      client: true,
      warehouse: true,
      store: true,
      lines: { include: { sku: true } },
      pallets: { include: { items: { include: { sku: true } } } },
      shipments: true,
    },
  })

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const totalPallets = order.pallets.length
  const totalWeight = order.pallets.reduce(
    (s, p) => s + (p.weight_lbs ? parseFloat(String(p.weight_lbs)) : 0),
    0
  )
  const totalUnits = order.lines.reduce((s, l) => s + l.ordered_qty, 0)

  const freightRows = order.pallets.length > 0
    ? order.pallets.map((p, i) => `
        <tr>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:center">${i + 1}</td>
          <td style="padding:6px 10px;border:1px solid #ddd">Pallet</td>
          <td style="padding:6px 10px;border:1px solid #ddd;font-family:monospace">${p.code}</td>
          <td style="padding:6px 10px;border:1px solid #ddd">
            ${p.items.map(item => item.sku.code).join(', ') || '—'}
          </td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:right">
            ${p.weight_lbs ? `${p.weight_lbs} lbs` : '—'}
          </td>
        </tr>`).join('')
    : order.lines.map((l, i) => `
        <tr>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:center">${i + 1}</td>
          <td style="padding:6px 10px;border:1px solid #ddd">Carton</td>
          <td style="padding:6px 10px;border:1px solid #ddd;font-family:monospace">${l.sku.code}</td>
          <td style="padding:6px 10px;border:1px solid #ddd">${l.sku.description}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:right">${l.ordered_qty} units</td>
        </tr>`).join('')

  const shipment = order.shipments[0]

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Bill of Lading — ${order.code}</title>
  <style>
    @media print { body { margin: 0; } }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #222; margin: 30px; }
    .bol-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a2744; padding-bottom: 16px; margin-bottom: 20px; }
    .logo { font-size: 24px; font-weight: bold; color: #1a2744; }
    .logo span { color: #f4811f; }
    .bol-title { font-size: 20px; font-weight: bold; text-align: right; color: #1a2744; }
    .section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .box { border: 1px solid #ccc; border-radius: 4px; padding: 12px; }
    .box h3 { margin: 0 0 10px; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 1px solid #eee; padding-bottom: 6px; }
    .field { margin-bottom: 8px; }
    .field label { display: block; font-size: 10px; color: #999; text-transform: uppercase; }
    .field span { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #1a2744; color: white; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
    h2 { font-size: 14px; margin: 20px 0 8px; color: #1a2744; border-bottom: 2px solid #1a2744; padding-bottom: 4px; }
    .signature-block { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; }
    .sig-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 6px; font-size: 11px; color: #666; }
    .footer { margin-top: 30px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
    .no-print { margin-top: 20px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="bol-header">
    <div>
      <div class="logo">STC <span>Logistics</span></div>
      <div style="font-size:11px;color:#666;margin-top:2px">Warehouse Management System</div>
    </div>
    <div>
      <div class="bol-title">BILL OF LADING</div>
      <div style="font-family:monospace;font-size:16px;text-align:right;margin-top:4px">${order.code}</div>
      <div style="font-size:11px;color:#666;text-align:right;margin-top:2px">Date: ${formatDate(new Date())}</div>
    </div>
  </div>

  <div class="section">
    <div class="box">
      <h3>Shipper / Origin</h3>
      <div class="field"><label>Warehouse</label><span>${order.warehouse.stc_reference_name}</span></div>
      <div class="field"><label>Client</label><span>${order.client.name}</span></div>
    </div>
    <div class="box">
      <h3>Consignee / Destination</h3>
      ${order.store
        ? `<div class="field"><label>Store #</label><span>${order.store.store_num}</span></div>
           <div class="field"><label>Address</label><span>${order.store.address}</span></div>
           <div class="field"><label>City, State ZIP</label><span>${order.store.city}, ${order.store.state} ${order.store.zip}</span></div>`
        : `<div class="field"><label>Destination</label><span>${order.client.name}</span></div>`
      }
    </div>
  </div>

  <div class="section">
    <div class="box">
      <h3>Carrier Information</h3>
      <div class="field"><label>Carrier</label><span>${shipment?.carrier ?? '______________________________'}</span></div>
      <div class="field"><label>PRO Number</label><span>${shipment?.pro_number ?? '______________________________'}</span></div>
      <div class="field"><label>Tracking #</label><span>${shipment?.tracking ?? '______________________________'}</span></div>
    </div>
    <div class="box">
      <h3>Shipment Summary</h3>
      <div class="field"><label>Load Type</label><span>${order.load_type.replace(/_/g, ' ')}</span></div>
      <div class="field"><label>Total Pallets</label><span>${totalPallets || '—'}</span></div>
      <div class="field"><label>Total Weight</label><span>${totalWeight > 0 ? `${totalWeight.toFixed(1)} lbs` : '—'}</span></div>
      <div class="field"><label>Total Units</label><span>${totalUnits}</span></div>
    </div>
  </div>

  <h2>Freight Description</h2>
  <table>
    <thead>
      <tr>
        <th style="width:50px">#</th>
        <th>Kind</th>
        <th>Reference</th>
        <th>Description</th>
        <th style="text-align:right">Weight / Qty</th>
      </tr>
    </thead>
    <tbody>${freightRows}</tbody>
    <tfoot>
      <tr style="background:#f8f9fa;font-weight:bold">
        <td colspan="4" style="padding:8px 10px;border:1px solid #ddd;text-align:right">Totals:</td>
        <td style="padding:8px 10px;border:1px solid #ddd;text-align:right">
          ${totalWeight > 0 ? `${totalWeight.toFixed(1)} lbs` : '—'}
        </td>
      </tr>
    </tfoot>
  </table>

  ${order.notes ? `<div style="background:#fff8e1;border:1px solid #ffe082;border-radius:4px;padding:10px 14px;margin-bottom:20px;font-size:12px"><strong>Special Instructions:</strong> ${order.notes}</div>` : ''}

  <div class="signature-block">
    <div>
      <div class="sig-line">Shipper Signature / Date</div>
    </div>
    <div>
      <div class="sig-line">Carrier Signature / Date</div>
    </div>
    <div>
      <div class="sig-line">Consignee Signature / Date</div>
    </div>
    <div>
      <div class="sig-line">Driver Name / License #</div>
    </div>
  </div>

  <div class="footer">
    This Bill of Lading constitutes a contract of carriage between shipper and carrier.
    STC Logistics WMS — ${order.code}
  </div>

  <div class="no-print">
    <button onclick="window.print()" style="padding:10px 20px;background:#1a2744;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px">
      Print / Save as PDF
    </button>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="bol-${order.code}.html"`,
    },
  })
}
