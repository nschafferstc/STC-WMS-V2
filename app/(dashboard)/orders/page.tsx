import React from 'react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function OrdersPage({ searchParams }: { searchParams: { status?: string; warehouse?: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const warehouseId = (session?.user as any)?.warehouseId
  const canCreate = ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR'].includes(role)

  const where: any = {}
  if (warehouseId) where.warehouse_id = warehouseId
  if (searchParams.status) where.status = searchParams.status
  if (searchParams.warehouse) where.warehouse_id = parseInt(searchParams.warehouse)

  const orders = await prisma.order.findMany({
    where,
    include: {
      client: true,
      warehouse: true,
      store: true,
      _count: { select: { lines: true, pallets: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const statusOptions = ['DRAFT', 'ALLOCATED', 'PARTIAL', 'READY', 'AT_RISK', 'COMPLETE', 'CANCELLED']

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Outbound fulfillment management"
        actions={
          canCreate && (
            <Button asChild style={{ background: '#1a2744', color: 'white' }}>
              <Link href="/orders/new"><Plus className="h-4 w-4 mr-1" />New Order</Link>
            </Button>
          )
        }
      />

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap mb-4">
        <Link
          href="/orders"
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            !searchParams.status
              ? 'bg-[#1a2744] text-white border-[#1a2744]'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
          }`}
        >
          All ({orders.length})
        </Link>
        {statusOptions.map(s => {
          const count = orders.filter(o => o.status === s).length
          if (count === 0) return null
          return (
            <Link
              key={s}
              href={`/orders?status=${s}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                searchParams.status === s
                  ? 'bg-[#1a2744] text-white border-[#1a2744]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {s.replace(/_/g, ' ')} ({count})
            </Link>
          )
        })}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Order</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Client</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Warehouse</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Store</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Load Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Lines</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Updated</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-medium text-blue-600 hover:underline font-mono text-xs"
                    >
                      {order.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{order.client.name}</td>
                  <td className="px-4 py-3 text-slate-600">{order.warehouse.stc_reference_name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {order.store ? `#${order.store.store_num}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{order.load_type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-slate-600">{order._count.lines}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(order.updatedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
