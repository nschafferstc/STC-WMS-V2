import React from 'react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StatusBadge } from '@/components/shared/status-badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function ReturnsPage({
  searchParams,
}: {
  searchParams: { status?: string; client_id?: string; warehouse_id?: string }
}) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const warehouseId = (session?.user as any)?.warehouseId
  const canCreate = ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR', 'WAREHOUSE_OPS'].includes(role)

  const [clients, warehouses] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: 'asc' } }),
    prisma.warehouse.findMany({ orderBy: { code: 'asc' } }),
  ])

  const where: any = {}
  if (warehouseId) where.warehouse_id = warehouseId
  if (searchParams.warehouse_id) where.warehouse_id = parseInt(searchParams.warehouse_id)
  if (searchParams.client_id) where.client_id = parseInt(searchParams.client_id)
  if (searchParams.status) where.status = searchParams.status

  const returns = await prisma.return.findMany({
    where,
    include: { warehouse: true, client: true, lines: true },
    orderBy: { createdAt: 'desc' },
  })

  const statusOptions = ['PENDING', 'RECEIVED', 'RESTOCKED', 'QUARANTINED', 'RETURNED_TO_VENDOR']
  const hasFilter = !!(searchParams.client_id || searchParams.warehouse_id)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Returns</h1>
          <p className="text-sm text-slate-500 mt-1">Inbound returns from job sites, customers, and vendors</p>
        </div>
        {canCreate && (
          <Button asChild style={{ background: '#1a2744', color: 'white' }}>
            <Link href="/returns/new"><Plus className="h-4 w-4 mr-1" />New Return</Link>
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
        {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
        <button type="submit" className="h-9 px-3 rounded bg-slate-700 text-white text-sm font-medium">Filter</button>
        {hasFilter && (
          <Link href={searchParams.status ? `/returns?status=${searchParams.status}` : '/returns'}
            className="h-9 px-3 flex items-center rounded border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
            Clear
          </Link>
        )}
      </form>

      {/* Status pills */}
      <div className="flex gap-2 flex-wrap mb-4">
        {(['', ...statusOptions] as string[]).map(s => {
          const isAll = s === ''
          const count = isAll ? returns.length : returns.filter(r => r.status === s).length
          if (!isAll && count === 0) return null
          const params = new URLSearchParams({
            ...(s ? { status: s } : {}),
            ...(searchParams.client_id ? { client_id: searchParams.client_id } : {}),
            ...(searchParams.warehouse_id ? { warehouse_id: searchParams.warehouse_id } : {}),
          })
          const active = isAll ? !searchParams.status : searchParams.status === s
          return (
            <Link key={s || 'all'} href={`/returns${params.toString() ? `?${params}` : ''}`}
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Client</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Warehouse</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Lines</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
            </tr>
          </thead>
          <tbody>
            {returns.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No returns found</td></tr>
            ) : returns.map(r => (
              <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3"><Link href={`/returns/${r.id}`} className="font-mono text-xs text-blue-600 hover:underline">{r.code}</Link></td>
                <td className="px-4 py-3 text-slate-700">{r.client.name}</td>
                <td className="px-4 py-3 text-slate-600">{r.warehouse.stc_reference_name}</td>
                <td className="px-4 py-3 text-slate-600">{r.return_type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-slate-600">{r.lines.length}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 bg-slate-50 border-t text-xs text-slate-500">{returns.length} returns</div>
      </div>
    </div>
  )
}
