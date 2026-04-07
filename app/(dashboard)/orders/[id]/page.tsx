import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { OrderActions } from '@/components/orders/order-actions'
import { PalletSection } from '@/components/orders/pallet-section'

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
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

  if (!order) notFound()

  const totalOrdered = order.lines.reduce((s, l) => s + l.ordered_qty, 0)
  const totalAllocated = order.lines.reduce((s, l) => s + l.allocated, 0)
  const totalShipped = order.lines.reduce((s, l) => s + l.shipped, 0)

  return (
    <div>
      <Link href="/orders" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Orders
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">{order.code}</h1>
            <StatusBadge status={order.status} />
          </div>
          <div className="text-sm text-slate-500">
            {order.client.name} · {order.warehouse.stc_reference_name}
            {order.store &&
              ` · Store #${order.store.store_num}, ${order.store.city}, ${order.store.state}`}
          </div>
        </div>
        <OrderActions order={{ id: order.id, status: order.status, code: order.code }} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-xs text-slate-500 uppercase font-medium">Load Type</div>
          <div className="text-lg font-semibold mt-1">{order.load_type.replace(/_/g, ' ')}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-xs text-slate-500 uppercase font-medium">Total Ordered</div>
          <div className="text-3xl font-bold mt-1">{totalOrdered}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-xs text-slate-500 uppercase font-medium">Allocated</div>
          <div className="text-3xl font-bold mt-1 text-blue-700">{totalAllocated}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-xs text-slate-500 uppercase font-medium">Shipped</div>
          <div className="text-3xl font-bold mt-1 text-green-700">{totalShipped}</div>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
          <span className="font-semibold">Notes: </span>{order.notes}
        </div>
      )}

      {/* Order Lines */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b font-semibold text-slate-900">Order Lines</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Ordered</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Allocated</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Shipped</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map(line => (
              <tr key={line.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3 font-mono text-xs font-medium">{line.sku.code}</td>
                <td className="px-4 py-3 text-slate-600">{line.sku.description}</td>
                <td className="px-4 py-3 text-right font-medium">{line.ordered_qty}</td>
                <td className="px-4 py-3 text-right text-blue-700">{line.allocated}</td>
                <td className="px-4 py-3 text-right text-green-700">{line.shipped}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pallets section (for Palletized/Mixed orders) */}
      {(order.load_type === 'PALLETIZED' || order.load_type === 'MIXED') && (
        <PalletSection
          orderId={order.id}
          pallets={order.pallets as any}
          orderStatus={order.status}
        />
      )}

      {/* Shipments */}
      {order.shipments.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mt-6">
          <div className="px-5 py-4 border-b font-semibold text-slate-900">Shipments</div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Shipment</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Carrier</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">PRO #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {order.shipments.map(s => (
                <tr key={s.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/shipments/${s.id}`}
                      className="text-blue-600 hover:underline font-mono text-xs"
                    >
                      {s.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{s.carrier ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{s.pro_number ?? '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
