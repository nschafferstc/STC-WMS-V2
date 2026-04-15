import React from 'react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StatusBadge } from '@/components/shared/status-badge'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Plus } from 'lucide-react'

export default async function ShipmentsPage({
  searchParams,
}: {
  searchParams: { client_id?: string; status?: string; warehouse_id?: string }
}) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const warehouseId = (session?.user as any)?.warehouseId
  const canCreate = ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR', 'WAREHOUSE_OPS'].includes(role)

  const [clients, warehouses] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: 'asc' } }),
    prisma.warehouse.findMany({ orderBy: { code: 'asc' } }),
  ])

  const orderWhere: any = {}
  if (warehouseId) orderWhere.warehouse_id = warehouseId
  if (searchParams.warehouse_id) orderWhere.warehouse_id = parseInt(searchParams.warehouse_id)
  if (searchParams.client_id) orderWhere.client_id = parseInt(searchParams.client_id)

  const where: any = {}
  if (Object.keys(orderWhere).length) where.order = orderWhere
  if (searchParams.status) where.status = searchParams.status

  const shipments = await prisma.shipment.findMany({
    where,
    include: { order: { include: { client: true, warehouse: true, store: true } }, pallets: true },
    orderBy: { createdAt: 'desc' },
  })

  const statusOptions = ['PENDING_PICKUP', 'IN_TRANSIT', 'DELIVERED', 'EXCEPTION']
  const hasFilter = !!(searchParams.client_id || searchParams.warehouse_id)

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
        {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
        <button type="submit" className="h-9 px-3 rounded bg-slate-700 text-white text-sm font-medium">Filter</button>
        {hasFilter && (
          <Link href={searchParams.status ? `/shipments?status=${searchParams.status}` : '/shipments'}
            className="h-9 px-3 flex items-center rounded border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
            Clear
          </Link>
        )}
      </form>

      {/* Status pills */}
      <div className="flex gap-2 flex-wrap mb-4">
        {(['', ...statusOptions] as string[]).map(s => {
          const isAll = s === ''
          const count = isAll ? shipments.length : shipments.filter(sh => sh.status === s).length
          if (!isAll && count === 0) return null
          const params = new URLSearchParams({
            ...(s ? { status: s } : {}),
            ...(searchParams.client_id ? { client_id: searchParams.client_id } : {}),
            ...(searchParams.warehouse_id ? { warehouse_id: searchParams.warehouse_id } : {}),
          })
          const active = isAll ? !searchParams.status : searchParams.status === s
          return (
            <Link key={s || 'all'} href={`/shipments${params.toString() ? `?${params}` : ''}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                active ? 'bg-[#1a2744] text-white border-[#1a2744]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {isAll ? 'All' : s.replace(/_/g, ' ')} ({count})
            </Link>
          )
        })}
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
            </tr>
          </thead>
          <tbody>
            {shipments.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-400">No shipments found</td></tr>
            ) : shipments.map(s => (
              <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/shipments/${s.id}`} className="font-medium text-blue-600 hover:underline font-mono text-xs">{s.code}</Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/orders/${s.order_id}`} className="text-blue-600 hover:underline font-mono text-xs">{s.order.code}</Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{s.order.client.name}</td>
                <td className="px-4 py-3 text-slate-600">{s.order.warehouse.stc_reference_name}</td>
                <td className="px-4 py-3 text-slate-600">{s.order.store ? `#${s.order.store.store_num}` : '—'}</td>
                <td className="px-4 py-3 text-slate-600">{s.carrier ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs">{s.pro_number ?? '—'}</td>
                <td className="px-4 py-3 text-right font-medium">{s.pallets.length}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(s.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 bg-slate-50 border-t text-xs text-slate-500">{shipments.length} shipments</div>
      </div>
    </div>
  )
}
