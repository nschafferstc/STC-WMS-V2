import React from 'react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'

export default async function ActivityReportPage({ searchParams }: { searchParams: { days?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return null
  const days = parseInt(searchParams.days ?? '30')
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const [asns, orders, receipts] = await Promise.all([
    prisma.aSN.findMany({ where: { createdAt: { gte: since } }, include: { client: true, warehouse: true }, orderBy: { createdAt: 'desc' } }),
    prisma.order.findMany({ where: { createdAt: { gte: since } }, include: { client: true, warehouse: true }, orderBy: { createdAt: 'desc' } }),
    prisma.inboundReceipt.findMany({ where: { createdAt: { gte: since } }, include: { asn: { include: { client: true, warehouse: true } } }, orderBy: { createdAt: 'desc' } }),
  ])

  return (
    <div>
      <PageHeader title="Activity Report" description={`Last ${days} days`} />
      <div className="flex gap-2 mb-6">
        {[7, 14, 30, 60, 90].map(d => (
          <a key={d} href={`?days=${d}`} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${days === d ? 'bg-[#1a2744] text-white border-[#1a2744]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>{d} days</a>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4"><div className="text-2xl font-bold">{asns.length}</div><div className="text-sm text-slate-500">ASNs Created</div></div>
        <div className="bg-white rounded-lg border border-slate-200 p-4"><div className="text-2xl font-bold">{orders.length}</div><div className="text-sm text-slate-500">Orders Created</div></div>
        <div className="bg-white rounded-lg border border-slate-200 p-4"><div className="text-2xl font-bold">{receipts.length}</div><div className="text-sm text-slate-500">Receipts Processed</div></div>
      </div>
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b"><h3 className="font-semibold text-sm">ASNs ({asns.length})</h3></div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr><th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Code</th><th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Client</th><th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Warehouse</th><th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Status</th><th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Date</th></tr></thead>
            <tbody>{asns.slice(0, 10).map(a => <tr key={a.id} className="border-b border-slate-50 last:border-0"><td className="px-4 py-2 font-mono text-xs">{a.code}</td><td className="px-4 py-2">{a.client.name}</td><td className="px-4 py-2">{a.warehouse.stc_reference_name}</td><td className="px-4 py-2"><StatusBadge status={a.status} /></td><td className="px-4 py-2 text-xs text-slate-500">{formatDate(a.createdAt)}</td></tr>)}{asns.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No ASNs in this period</td></tr>}</tbody>
          </table>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b"><h3 className="font-semibold text-sm">Orders ({orders.length})</h3></div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr><th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Code</th><th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Client</th><th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Warehouse</th><th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Status</th><th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Date</th></tr></thead>
            <tbody>{orders.slice(0, 10).map(o => <tr key={o.id} className="border-b border-slate-50 last:border-0"><td className="px-4 py-2 font-mono text-xs">{o.code}</td><td className="px-4 py-2">{o.client.name}</td><td className="px-4 py-2">{o.warehouse.stc_reference_name}</td><td className="px-4 py-2"><StatusBadge status={o.status} /></td><td className="px-4 py-2 text-xs text-slate-500">{formatDate(o.createdAt)}</td></tr>)}{orders.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No orders in this period</td></tr>}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
