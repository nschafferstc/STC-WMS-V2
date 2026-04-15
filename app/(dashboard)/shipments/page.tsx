import React from 'react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StatusBadge } from '@/components/shared/status-badge'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Plus } from 'lucide-react'

export default async function ShipmentsPage() {
  const session = await getServerSession(authOptions)
  const warehouseId = (session?.user as any)?.warehouseId

  const shipments = await prisma.shipment.findMany({
    where: warehouseId ? { order: { warehouse_id: warehouseId } } : undefined,
    include: {
      order: { include: { client: true, warehouse: true, store: true } },
      pallets: { include: { pallet: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const role = (session?.user as any)?.role
  const canCreate = ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR', 'WAREHOUSE_OPS'].includes(role)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shipments</h1>
          <p className="text-sm text-slate-500 mt-1">Outbound shipment tracking</p>
        </div>
        {canCreate && (
          <Link href="/shipments/new" className="inline-flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium text-white" style={{ background: '#1a2744' }}>
            <Plus className="h-4 w-4" />New Shipment
          </Link>
        )}
      </div>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Shipment</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Order</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Client</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Warehouse</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Store</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Carrier</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">PRO #</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Pallets</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Created</th>
            </tr>
          </thead>
          <tbody>
            {shipments.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                  No shipments found
                </td>
              </tr>
            ) : shipments.map(s => (
              <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/shipments/${s.id}`}
                    className="font-medium text-blue-600 hover:underline font-mono text-xs"
                  >
                    {s.code}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/orders/${s.order_id}`}
                    className="text-blue-600 hover:underline font-mono text-xs"
                  >
                    {s.order.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{s.order.client.name}</td>
                <td className="px-4 py-3 text-slate-600">{s.order.warehouse.stc_reference_name}</td>
                <td className="px-4 py-3 text-slate-600">
                  {s.order.store ? `#${s.order.store.store_num}` : '—'}
                </td>
                <td className="px-4 py-3 text-slate-600">{s.carrier ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs">{s.pro_number ?? '—'}</td>
                <td className="px-4 py-3 text-right font-medium">{s.pallets.length}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(s.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 bg-slate-50 border-t text-xs text-slate-500">
          {shipments.length} shipments
        </div>
      </div>
    </div>
  )
}
