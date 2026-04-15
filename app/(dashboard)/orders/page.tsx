import React from 'react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Zap } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; client_id?: string; project_id?: string; warehouse_id?: string }
}) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const warehouseId = (session?.user as any)?.warehouseId
  const canCreate = ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR'].includes(role)

  const [clients, projects, warehouses] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: 'asc' } }),
    prisma.project.findMany({
      where: searchParams.client_id ? { client_id: parseInt(searchParams.client_id) } : undefined,
      include: { client: true },
      orderBy: { name: 'asc' },
    }),
    prisma.warehouse.findMany({ orderBy: { code: 'asc' } }),
  ])

  const where: any = {}
  if (warehouseId) where.warehouse_id = warehouseId
  if (searchParams.warehouse_id) where.warehouse_id = parseInt(searchParams.warehouse_id)
  if (searchParams.status) where.status = searchParams.status
  if (searchParams.client_id) where.client_id = parseInt(searchParams.client_id)
  if (searchParams.project_id) where.store = { project_id: parseInt(searchParams.project_id) }

  const orders = await prisma.order.findMany({
    where,
    include: {
      client: true,
      warehouse: true,
      store: { include: { project: true } },
      _count: { select: { lines: true, pallets: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const statusOptions = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SENT_TO_WAREHOUSE', 'WAREHOUSE_CONFIRMED', 'READY', 'AT_RISK', 'COMPLETE', 'CANCELLED']
  const hasFilter = !!(searchParams.client_id || searchParams.project_id || searchParams.warehouse_id)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500 mt-1">Outbound fulfillment management</p>
        </div>
        {canCreate && (
          <Button asChild style={{ background: '#1a2744', color: 'white' }}>
            <Link href="/orders/new"><Plus className="h-4 w-4 mr-1" />New Order</Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-2 mb-4 items-center">
        {!warehouseId && (
          <select name="warehouse_id" defaultValue={searchParams.warehouse_id ?? ''}
            className="h-9 rounded border border-slate-200 bg-white px-2 text-sm">
            <option value="">All Warehouses</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.stc_reference_name}</option>)}
          </select>
        )}
        <select name="client_id" defaultValue={searchParams.client_id ?? ''}
          className="h-9 rounded border border-slate-200 bg-white px-2 text-sm">
          <option value="">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="project_id" defaultValue={searchParams.project_id ?? ''}
          className="h-9 rounded border border-slate-200 bg-white px-2 text-sm">
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}{!searchParams.client_id && ` (${p.client.name})`}</option>)}
        </select>
        {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
        <button type="submit" className="h-9 px-3 rounded bg-slate-700 text-white text-sm font-medium">Filter</button>
        {hasFilter && (
          <Link href={searchParams.status ? `/orders?status=${searchParams.status}` : '/orders'}
            className="h-9 px-3 flex items-center rounded border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
            Clear
          </Link>
        )}
      </form>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap mb-4">
        <Link
          href={`/orders${hasFilter ? `?${new URLSearchParams({ ...(searchParams.client_id ? { client_id: searchParams.client_id } : {}), ...(searchParams.project_id ? { project_id: searchParams.project_id } : {}), ...(searchParams.warehouse_id ? { warehouse_id: searchParams.warehouse_id } : {}) }).toString()}` : ''}`}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            !searchParams.status ? 'bg-[#1a2744] text-white border-[#1a2744]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
          }`}
        >
          All ({orders.length})
        </Link>
        {statusOptions.map(s => {
          const count = orders.filter(o => o.status === s).length
          if (count === 0) return null
          const params = new URLSearchParams({
            status: s,
            ...(searchParams.client_id ? { client_id: searchParams.client_id } : {}),
            ...(searchParams.project_id ? { project_id: searchParams.project_id } : {}),
            ...(searchParams.warehouse_id ? { warehouse_id: searchParams.warehouse_id } : {}),
          })
          return (
            <Link key={s} href={`/orders?${params}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                searchParams.status === s ? 'bg-[#1a2744] text-white border-[#1a2744]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Project</th>
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
              <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">No orders found</td></tr>
            ) : orders.map(order => (
              <tr key={order.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {(order as any).is_priority && <span title="Priority"><Zap className="h-3 w-3 text-orange-500 flex-shrink-0" /></span>}
                    <Link href={`/orders/${order.id}`} className="font-medium text-blue-600 hover:underline font-mono text-xs">
                      {order.code}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-700">{order.client.name}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{order.store?.project?.name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{order.warehouse.stc_reference_name}</td>
                <td className="px-4 py-3 text-slate-600">{order.store ? `#${order.store.store_num}` : '—'}</td>
                <td className="px-4 py-3 text-slate-600">{order.load_type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-slate-600">{order._count.lines}</td>
                <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(order.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 bg-slate-50 border-t text-xs text-slate-500">{orders.length} orders</div>
      </div>
    </div>
  )
}
