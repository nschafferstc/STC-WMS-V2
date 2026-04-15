import React from 'react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function ReceivingPage({
  searchParams,
}: {
  searchParams: { status?: string; client_id?: string; warehouse_id?: string }
}) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const warehouseId = (session?.user as any)?.warehouseId
  const canCreate = ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR'].includes(role)

  const [clients, warehouses] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: 'asc' } }),
    prisma.warehouse.findMany({ orderBy: { code: 'asc' } }),
  ])

  const where: any = {}
  if (warehouseId) where.warehouse_id = warehouseId
  if (searchParams.warehouse_id) where.warehouse_id = parseInt(searchParams.warehouse_id)
  if (searchParams.client_id) where.client_id = parseInt(searchParams.client_id)
  if (searchParams.status) where.status = searchParams.status

  const asns = await prisma.aSN.findMany({
    where,
    include: { client: true, warehouse: true, lines: true, receipts: true },
    orderBy: { createdAt: 'desc' },
  })

  const statusOptions = ['SCHEDULED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED']
  const hasFilter = !!(searchParams.client_id || searchParams.warehouse_id)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Receiving</h1>
          <p className="text-sm text-slate-500 mt-1">Advance Shipment Notices and inbound receipts</p>
        </div>
        {canCreate && (
          <Button asChild style={{ background: '#1a2744', color: 'white' }}>
            <Link href="/receiving/new"><Plus className="h-4 w-4 mr-1" />New ASN</Link>
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
          <Link href={searchParams.status ? `/receiving?status=${searchParams.status}` : '/receiving'}
            className="h-9 px-3 flex items-center rounded border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
            Clear
          </Link>
        )}
      </form>

      {/* Status pills */}
      <div className="flex gap-2 flex-wrap mb-4">
        {(['', ...statusOptions] as string[]).map(s => {
          const isAll = s === ''
          const count = isAll ? asns.length : asns.filter(a => a.status === s).length
          if (!isAll && count === 0) return null
          const params = new URLSearchParams({
            ...(s ? { status: s } : {}),
            ...(searchParams.client_id ? { client_id: searchParams.client_id } : {}),
            ...(searchParams.warehouse_id ? { warehouse_id: searchParams.warehouse_id } : {}),
          })
          const active = isAll ? !searchParams.status : searchParams.status === s
          return (
            <Link key={s || 'all'} href={`/receiving${params.toString() ? `?${params}` : ''}`}
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">ASN</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Client</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Warehouse</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Carrier</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Lines</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Receipts</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Expected</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {asns.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No ASNs found</td></tr>
            ) : asns.map(asn => (
              <tr key={asn.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/receiving/${asn.id}`} className="font-medium text-blue-600 hover:underline font-mono text-xs">
                    {asn.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{asn.client.name}</td>
                <td className="px-4 py-3 text-slate-600">{asn.warehouse.stc_reference_name}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{asn.carrier ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{asn.lines.length}</td>
                <td className="px-4 py-3 text-slate-600">{asn.receipts.length}</td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {asn.expected_date ? formatDate(asn.expected_date) : '—'}
                </td>
                <td className="px-4 py-3"><StatusBadge status={asn.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 bg-slate-50 border-t text-xs text-slate-500">{asns.length} ASNs</div>
      </div>
    </div>
  )
}
