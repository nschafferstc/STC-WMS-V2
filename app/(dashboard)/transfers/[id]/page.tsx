import React from 'react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'

export default async function TransferDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const transfer = await prisma.transferOrder.findUnique({
    where: { id: parseInt(params.id) },
    include: { from_warehouse: true, to_warehouse: true, lines: { include: { sku: true } } },
  })
  if (!transfer) notFound()

  return (
    <div>
      <PageHeader title={transfer.code} description="Transfer Order Detail" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Status</span><StatusBadge status={transfer.status} /></div>
              <div className="flex justify-between"><span className="text-slate-500">From</span><span className="font-medium">{transfer.from_warehouse.stc_reference_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">To</span><span className="font-medium">{transfer.to_warehouse.stc_reference_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Created</span><span>{formatDate(transfer.createdAt)}</span></div>
              {transfer.confirmed_at && <div className="flex justify-between"><span className="text-slate-500">Confirmed</span><span>{formatDate(transfer.confirmed_at)}</span></div>}
              {transfer.received_at && <div className="flex justify-between"><span className="text-slate-500">Received</span><span>{formatDate(transfer.received_at)}</span></div>}
            </div>
            {transfer.notes && <div className="mt-3 pt-3 border-t text-sm text-slate-600">{transfer.notes}</div>}
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold">Transfer Lines</h3></div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">SKU</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Requested</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Sent</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Received</th>
                </tr>
              </thead>
              <tbody>
                {transfer.lines.map(line => (
                  <tr key={line.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3"><div className="font-mono text-xs text-slate-700">{line.sku.code}</div><div className="text-xs text-slate-500">{line.sku.description?.slice(0, 50)}</div></td>
                    <td className="px-4 py-3 text-right">{line.qty_requested}</td>
                    <td className="px-4 py-3 text-right">{line.qty_sent ?? '—'}</td>
                    <td className="px-4 py-3 text-right">{line.qty_received ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
