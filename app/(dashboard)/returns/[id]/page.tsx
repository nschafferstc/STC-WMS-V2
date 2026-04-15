import React from 'react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'

export default async function ReturnDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const ret = await prisma.return.findUnique({
    where: { id: parseInt(params.id) },
    include: { warehouse: true, client: true, lines: { include: { sku: true } } },
  })
  if (!ret) notFound()

  return (
    <div>
      <PageHeader title={ret.code} description="Return Detail" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Status</span><StatusBadge status={ret.status} /></div>
              <div className="flex justify-between"><span className="text-slate-500">Type</span><span>{ret.return_type.replace(/_/g, ' ')}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Client</span><span className="font-medium">{ret.client.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Warehouse</span><span>{ret.warehouse.stc_reference_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Created</span><span>{formatDate(ret.createdAt)}</span></div>
              {ret.received_at && <div className="flex justify-between"><span className="text-slate-500">Received</span><span>{formatDate(ret.received_at)}</span></div>}
            </div>
            {ret.notes && <div className="mt-3 pt-3 border-t text-sm text-slate-600">{ret.notes}</div>}
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold">Returned Items</h3></div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">SKU</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Condition</th>
                </tr>
              </thead>
              <tbody>
                {ret.lines.map(line => (
                  <tr key={line.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3"><div className="font-mono text-xs">{line.sku.code}</div><div className="text-xs text-slate-500">{line.sku.description?.slice(0, 50)}</div></td>
                    <td className="px-4 py-3 text-right">{line.qty}</td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${line.condition === 'GOOD' ? 'bg-green-100 text-green-700' : line.condition === 'DAMAGED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{line.condition}</span></td>
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
