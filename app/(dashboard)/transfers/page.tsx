import React from 'react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StatusBadge } from '@/components/shared/status-badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function TransfersPage({
  searchParams,
}: {
  searchParams: { status?: string; warehouse_id?: string }
}) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const warehouseId = (session?.user as any)?.warehouseId
  const canCreate = ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR'].includes(role)

  const warehouses = await prisma.warehouse.findMany({ orderBy: { code: 'asc' } })

  const where: any = {}
  if (searchParams.status) where.status = searchParams.status
  if (searchParams.warehouse_id) {
    const wId = parseInt(searchParams.warehouse_id)
    where.OR = [{ from_warehouse_id: wId }, { to_warehouse_id: wId }]
  } else if (warehouseId) {
    where.OR = [{ from_warehouse_id: warehouseId }, { to_warehouse_id: warehouseId }]
  }

  const transfers = await prisma.transferOrder.findMany({
    where,
    include: { from_warehouse: true, to_warehouse: true, lines: true },
    orderBy: { createdAt: 'desc' },
  })

  const statusOptions = ['PENDING', 'CONFIRMED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED']
  const hasFilter = !!searchParams.warehouse_id

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transfer Orders</h1>
          <p className="text-sm text-slate-500 mt-1">Inter-warehouse inventory transfers</p>
        </div>
        {canCreate && (
          <Button asChild style={{ background: '#1a2744', color: 'white' }}>
            <Link href="/transfers/new"><Plus className="h-4 w-4 mr-1" />New Transfer</Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-2 mb-4 items-center">
        <select name="warehouse_id" defaultValue={searchParams.warehouse_id ?? ''}
          className="h-9 rounded border border-slate-200 bg-white px-2 text-sm">
          <option value="">All Warehouses</option>
          {warehouses.map(w => <option key={w.id} value={w.id}>{w.stc_reference_name}</option>)}
        </select>
        {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
        <button type="submit" className="h-9 px-3 rounded bg-slate-700 text-white text-sm font-medium">Filter</button>
        {hasFilter && (
          <Link href={searchParams.status ? `/transfers?status=${searchParams.status}` : '/transfers'}
            className="h-9 px-3 flex items-center rounded border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
            Clear
          </Link>
        )}
      </form>

      {/* Status pills */}
      <div className="flex gap-2 flex-wrap mb-4">
        {(['', ...statusOptions] as string[]).map(s => {
          const isAll = s === ''
          const count = isAll ? transfers.length : transfers.filter(t => t.status === s).length
          if (!isAll && count === 0) return null
          const params = new URLSearchParams({
            ...(s ? { status: s } : {}),
            ...(searchParams.warehouse_id ? { warehouse_id: searchParams.warehouse_id } : {}),
          })
          const active = isAll ? !searchParams.status : searchParams.status === s
          return (
            <Link key={s || 'all'} href={`/transfers${params.toString() ? `?${params}` : ''}`}
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">From</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">To</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Lines</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Created</th>
            </tr>
          </thead>
          <tbody>
            {transfers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No transfer orders found</td></tr>
            ) : transfers.map(t => (
              <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3"><Link href={`/transfers/${t.id}`} className="font-mono text-xs text-blue-600 hover:underline">{t.code}</Link></td>
                <td className="px-4 py-3 text-slate-700">{t.from_warehouse.stc_reference_name}</td>
                <td className="px-4 py-3 text-slate-700">{t.to_warehouse.stc_reference_name}</td>
                <td className="px-4 py-3 text-slate-600">{t.lines.length}</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(t.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 bg-slate-50 border-t text-xs text-slate-500">{transfers.length} transfers</div>
      </div>
    </div>
  )
}
