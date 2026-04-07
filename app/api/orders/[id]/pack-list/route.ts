import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

// GET /api/orders/[id]/pack-list — returns printable HTML pack list
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
    },
  })

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const totalUnits = order.lines.reduce((s, l) => s + l.ordered_qty, 0)

  const palletRows =
    order.pallets.length > 0
      ? order.pallets
          .map(
            p => `
          <tr>
            <td style="padding:6px 10px;border:1px solid #ddd;font-family:monospace">${p.code}</td>
            <td style="padding:6px 10px;border:1px solid #ddd">
              ${p.items.map(i => `${i.sku.code} × ${i.qty}`).join('<br>') || '—'}
            </td>
            <td style="padding:6px 10px;border:1px solid #ddd">
              ${p.length && p.width && p.height ? `${p.length}×${p.width}×${p.height}"` : '—'}
            </td>
            <td style="padding:6px 10px;border:1px solid #ddd">${p.weight_lbs ? `${p.weight_lbs} lbs` : '—'}</td>
            <td style="padding:6px 10px;border:1px solid #ddd">${p.shrink_wrapped ? 'Yes' : 'No'}</td>
          </tr>`
          )
          .join('')
      : `<tr><td colspan="5" style="padding:10px;text-align:center;color:#999">No pallets recorded</td></tr>`

  const lineRows = order.lines
    .map(
      l => `
      <tr>
        <td style="padding:6px 10px;border:1px solid #ddd;font-family:monospace">${l.sku.code}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${l.sku.description}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right">${l.ordered_qty}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right">${l.allocated}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right">${l.shipped}</td>
      </tr>`
    )
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Pack List — ${order.code}</title>
  <style>
    @media print { body { margin: 0; } }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #222; margin: 30px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .logo { font-size: 22px; font-weight: bold; color: #1a2744; }
    .logo span { color: #f4811f; }
    .title { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; padding: 14px; background: #f8f9fa; border-radius: 4px; }
    .meta-item label { font-size: 11px; color: #666; text-transform: uppercase; display: block; margin-bottom: 2px; }
    .meta-item span { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #1a2744; color: white; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
    h2 { font-size: 14px; margin: 20px 0 8px; color: #1a2744; border-bottom: 2px solid #1a2744; padding-bottom: 4px; }
    .footer { margin-top: 30px; font-size: 11px; color: #999; text-align: center; }
    .no-print { margin-top: 20px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">STC <span>Logistics</span></div>
      <div style="font-size:11px;color:#666;margin-top:2px">Warehouse Management System</div>
    </div>
    <div style="text-align:right">
      <div class="title">PACK LIST</div>
      <div style="font-family:monospace;font-size:16px;color:#1a2744">${order.code}</div>
      <div style="font-size:11px;color:#666;margin-top:4px">Generated: ${formatDate(new Date())}</div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-item"><label>Client</label><span>${order.client.name}</span></div>
    <div class="meta-item"><label>Warehouse</label><span>${order.warehouse.stc_reference_name}</span></div>
    <div class="meta-item"><label>Load Type</label><span>${order.load_type.replace(/_/g, ' ')}</span></div>
    <div class="meta-item"><label>Status</label><span>${order.status}</span></div>
    ${order.store ? `<div class="meta-item"><label>Store</label><span>#${order.store.store_num} — ${order.store.city}, ${order.store.state}</span></div>` : ''}
    <div class="meta-item"><label>Total Units</label><span>${totalUnits}</span></div>
    ${order.notes ? `<div class="meta-item" style="grid-column:span 2"><label>Notes</label><span>${order.notes}</span></div>` : ''}
  </div>

  <h2>Order Lines</h2>
  <table>
    <thead>
      <tr>
        <th>SKU Code</th>
        <th>Description</th>
        <th style="text-align:right">Ordered</th>
        <th style="text-align:right">Allocated</th>
        <th style="text-align:right">Shipped</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
  </table>

  <h2>Pallets (${order.pallets.length})</h2>
  <table>
    <thead>
      <tr>
        <th>Pallet Code</th>
        <th>Items</th>
        <th>Dimensions (L×W×H)</th>
        <th>Weight</th>
        <th>Shrink Wrapped</th>
      </tr>
    </thead>
    <tbody>${palletRows}</tbody>
  </table>

  <div class="footer">STC Logistics WMS — Confidential — ${order.code}</div>

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
      'Content-Disposition': `inline; filename="pack-list-${order.code}.html"`,
    },
  })
}
