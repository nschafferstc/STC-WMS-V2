import React from 'react'
import { prisma } from '@/lib/prisma'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

const DISCREPANCY_TYPES = ['BOX_CRUSHED', 'WATER_DAMAGE', 'PACKAGING_DAMAGE', 'MISSING_ITEM', 'OVERAGE', 'WRONG_ITEM', 'OTHER']

export default async function DiscrepanciesPage({
  searchParams,
}: {
  searchParams: { status?: string; type?: string; search?: string }
}) {
  const where: any = {}
  if (searchParams.status) where.status = searchParams.status
  if (searchParams.type) where.type = searchParams.type

  const discrepancies = await prisma.discrepancy.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  // Apply text search client-side (source_ref or description)
  const filtered = searchParams.search
    ? discrepancies.filter(d =>
        d.source_ref.toLowerCase().includes(searchParams.search!.toLowerCase()) ||
        d.description.toLowerCase().includes(searchParams.search!.toLowerCase())
      )
    : discrepancies

  // Counts for summary cards — always based on unfiltered set
  const allDiscrepancies = await prisma.discrepancy.findMany()
  const openCount = allDiscrepancies.filter(d => d.status === 'OPEN').length
  const underReviewCount = allDiscrepancies.filter(d => d.status === 'UNDER_REVIEW').length
  const resolvedCount = allDiscrepancies.filter(d => d.status === 'RESOLVED').length

  const hasFilter = !!(searchParams.type || searchParams.search)

  const buildStatusHref = (s: string) => {
    const params = new URLSearchParams({
      ...(s && s !== 'all' ? { status: s } : {}),
      ...(searchParams.type ? { type: searchParams.type } : {}),
      ...(searchParams.search ? { search: searchParams.search } : {}),
    })
    return `/discrepancies${params.toString() ? `?${params}` : ''}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Discrepancies</h1>
          <p className="text-sm text-slate-500 mt-1">Receiving exceptions and inventory discrepancies</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="flex gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4 border-l-4 border-l-red-500 flex-1">
          <div className="text-xs text-slate-500 uppercase font-medium">Open</div>
          <div className="text-3xl font-bold mt-1 text-red-700">{openCount}</div>
        </div>
        <div className="bg-white rounded-lg border p-4 border-l-4 border-l-yellow-500 flex-1">
          <div className="text-xs text-slate-500 uppercase font-medium">Under Review</div>
          <div className="text-3xl font-bold mt-1 text-yellow-700">{underReviewCount}</div>
        </div>
        <div className="bg-white rounded-lg border p-4 border-l-4 border-l-green-500 flex-1">
          <div className="text-xs text-slate-500 uppercase font-medium">Resolved</div>
          <div className="text-3xl font-bold mt-1 text-green-700">{resolvedCount}</div>
        </div>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-2 mb-4 items-center">
        <input
          name="search"
          defaultValue={searchParams.search ?? ''}
          placeholder="Search source ref or description..."
          className="h-9 rounded border border-slate-200 bg-white px-2 text-sm w-56"
        />
        <select name="type" defaultValue={searchParams.type ?? ''}
          className="h-9 rounded border border-slate-200 bg-white px-2 text-sm">
          <option value="">All Types</option>
          {DISCREPANCY_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
        <button type="submit" className="h-9 px-3 rounded bg-slate-700 text-white text-sm font-medium">Filter</button>
        {hasFilter && (
          <Link href={searchParams.status ? `/discrepancies?status=${searchParams.status}` : '/discrepancies'}
            className="h-9 px-3 flex items-center rounded border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
            Clear
          </Link>
        )}
      </form>

      {/* Status filter pills */}
      <div className="flex gap-2 mb-4">
        {(['all', 'OPEN', 'UNDER_REVIEW', 'RESOLVED'] as const).map(s => {
          const isAll = s === 'all'
          const isActive = isAll ? !searchParams.status : searchParams.status === s
          const label = isAll ? 'All' : s.replace(/_/g, ' ')
          const count = isAll ? allDiscrepancies.length : allDiscrepancies.filter(d => d.status === s).length
          return (
            <Link
              key={s}
              href={buildStatusHref(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                isActive
                  ? 'bg-[#1a2744] text-white border-[#1a2744]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {label} ({count})
            </Link>
          )
        })}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Source</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  No discrepancies found
                </td>
              </tr>
            ) : filtered.map(d => (
              <tr
                key={d.id}
                className={`border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer ${d.status === 'OPEN' ? 'bg-red-50/20' : ''}`}
                onClick={() => { window.location.href = `/discrepancies/${d.id}` }}
              >
                <td className="px-4 py-3">
                  <Link href={`/discrepancies/${d.id}`} className="font-mono text-xs font-medium text-blue-600 hover:underline">
                    DISC-{String(d.id).padStart(4, '0')}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{d.type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 font-mono text-xs">{d.source_ref}</td>
                <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={d.description}>
                  {d.description}
                </td>
                <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(d.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 bg-slate-50 border-t text-xs text-slate-500">
          {filtered.length} records
        </div>
      </div>
    </div>
  )
}
