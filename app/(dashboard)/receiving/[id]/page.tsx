import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ReceiptForm } from '@/components/receiving/receipt-form'

export default async function ASNDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role

  const asn = await prisma.aSN.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      client: true,
      warehouse: true,
      lines: { include: { sku: true } },
      receipts: {
        include: {
          lines: { include: { sku: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!asn) notFound()

  const canReceive = ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR', 'WAREHOUSE_OPS'].includes(role)
  const isOpen = asn.status !== 'RECEIVED' && asn.status !== 'CANCELLED'

  // Compute totals
  const totalExpected = asn.lines.reduce((s, l) => s + l.expected_qty, 0)
  const totalReceived = asn.receipts.reduce(
    (sum, r) => sum + r.lines.reduce((s, l) => s + l.received_qty, 0),
    0
  )

  return (
    <div>
      <Link
        href="/receiving"
        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Receiving
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">{asn.code}</h1>
            <StatusBadge status={asn.status} />
          </div>
          <div className="text-sm text-slate-500">
            {asn.client.name} · {asn.warehouse.stc_reference_name}
            {asn.expected_date && ` · Expected: ${formatDate(asn.expected_date)}`}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-xs text-slate-500 uppercase font-medium">Lines</div>
          <div className="text-3xl font-bold mt-1">{asn.lines.length}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-xs text-slate-500 uppercase font-medium">Expected Units</div>
          <div className="text-3xl font-bold mt-1">{totalExpected}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-xs text-slate-500 uppercase font-medium">Received Units</div>
          <div className="text-3xl font-bold mt-1 text-green-700">{totalReceived}</div>
        </div>
      </div>

      {/* Notes */}
      {asn.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
          <span className="font-semibold">Notes: </span>{asn.notes}
        </div>
      )}

      {/* Expected Lines */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b font-semibold text-slate-900">Expected Lines</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                Description
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                Expected Qty
              </th>
            </tr>
          </thead>
          <tbody>
            {asn.lines.map(line => (
              <tr key={line.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3 font-mono text-xs font-medium">{line.sku.code}</td>
                <td className="px-4 py-3 text-slate-600">{line.sku.description}</td>
                <td className="px-4 py-3 text-right font-medium">{line.expected_qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Receipt History */}
      {asn.receipts.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b font-semibold text-slate-900">
            Receipt History ({asn.receipts.length})
          </div>
          <div className="divide-y divide-slate-100">
            {asn.receipts.map(receipt => {
              const hasDiscrepancies = receipt.lines.some(
                l => l.received_qty !== l.expected_qty || l.discrepancy_type
              )
              return (
                <div key={receipt.id} className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm font-mono">{receipt.code}</span>
                      <StatusBadge status={receipt.status} />
                      {hasDiscrepancies && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          Has Discrepancies
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{formatDate(receipt.createdAt)}</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500">
                        <th className="text-left pb-1">SKU</th>
                        <th className="text-right pb-1">Expected</th>
                        <th className="text-right pb-1">Received</th>
                        <th className="text-left pb-1 pl-4">Discrepancy</th>
                        <th className="text-left pb-1 pl-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receipt.lines.map(line => (
                        <tr
                          key={line.id}
                          className={
                            line.received_qty !== line.expected_qty ? 'text-red-700' : 'text-slate-700'
                          }
                        >
                          <td className="py-0.5 font-mono font-medium">{line.sku.code}</td>
                          <td className="py-0.5 text-right">{line.expected_qty}</td>
                          <td className="py-0.5 text-right">{line.received_qty}</td>
                          <td className="py-0.5 pl-4">
                            {line.discrepancy_type
                              ? line.discrepancy_type.replace(/_/g, ' ')
                              : '—'}
                          </td>
                          <td className="py-0.5 pl-4 text-slate-500">{line.notes ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Receipt Form — only show if ASN is still open and user can receive */}
      {canReceive && isOpen && asn.lines.length > 0 && (
        <ReceiptForm
          asnId={asn.id}
          lines={asn.lines.map(l => ({
            sku_id: l.sku_id,
            sku: { code: l.sku.code, description: l.sku.description },
            expected_qty: l.expected_qty,
          }))}
        />
      )}
    </div>
  )
}
