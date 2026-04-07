import React from 'react'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'

export default async function DiscrepanciesPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const discrepancies = await prisma.discrepancy.findMany({
    where: searchParams.status ? { status: searchParams.status as any } : undefined,
    orderBy: { createdAt: 'desc' },
  })

  // Counts always based on all records for the summary cards
  const allDiscrepancies = searchParams.status
    ? await prisma.discrepancy.findMany({ orderBy: { createdAt: 'desc' } })
    : discrepancies

  const openCount = allDiscrepancies.filter(d => d.status === 'OPEN').length
  const underReviewCount = allDiscrepancies.filter(d => d.status === 'UNDER_REVIEW').length
  const resolvedCount = allDiscrepancies.filter(d => d.status === 'RESOLVED').length
  const totalCount = allDiscrepancies.length

  const filterCounts: Record<string, number> = {
    all: totalCount,
    OPEN: openCount,
    UNDER_REVIEW: underReviewCount,
    RESOLVED: resolvedCount,
  }

  return (
    <div>
      <PageHeader
        title="Discrepancies"
        description="Receiving exceptions and inventory discrepancies"
      />

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

      {/* Status filter pills */}
      <div className="flex gap-2 mb-4">
        {(['all', 'OPEN', 'UNDER_REVIEW', 'RESOLVED'] as const).map(s => {
          const isAll = s === 'all'
          const isActive = isAll ? !searchParams.status : searchParams.status === s
          const label = isAll ? 'All' : s.replace(/_/g, ' ')
          const count = filterCounts[s]
          return (
            <a
              key={s}
              href={isAll ? '/discrepancies' : `/discrepancies?status=${s}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                isActive
                  ? 'bg-[#1a2744] text-white border-[#1a2744]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {label} ({count})
            </a>
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
            {discrepancies.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  No discrepancies found
                </td>
              </tr>
            ) : discrepancies.map(d => (
              <tr
                key={d.id}
                className={`border-b border-slate-50 last:border-0 hover:bg-slate-50 ${d.status === 'OPEN' ? 'bg-red-50/20' : ''}`}
              >
                <td className="px-4 py-3 font-mono text-xs font-medium">
                  DISC-{String(d.id).padStart(4, '0')}
                </td>
                <td className="px-4 py-3 text-slate-700">{d.type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 font-mono text-xs">{d.source_ref}</td>
                <td
                  className="px-4 py-3 text-slate-600 max-w-xs truncate"
                  title={d.description}
                >
                  {d.description}
                </td>
                <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(d.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 bg-slate-50 border-t text-xs text-slate-500">
          {discrepancies.length} records
        </div>
      </div>
    </div>
  )
}
