import React from 'react'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function ShipmentDetailPage({ params }: { params: { id: string } }) {
  const shipment = await prisma.shipment.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      order: {
        include: {
          client: true,
          warehouse: true,
          store: true,
          lines: { include: { sku: true } },
        },
      },
      pallets: {
        include: {
          pallet: {
            include: {
              items: { include: { sku: true } },
            },
          },
        },
      },
    },
  })

  if (!shipment) notFound()

  const pallets = shipment.pallets.map(sp => sp.pallet)
  const totalPallets = pallets.length
  const totalWeight = pallets.reduce((s, p) => s + (Number(p.weight_lbs) || 0), 0)

  return (
    <div>
      <Link href="/shipments" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Shipments
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">{shipment.code}</h1>
            <StatusBadge status={shipment.status} />
          </div>
          <div className="text-sm text-slate-500">
            Order {shipment.order.code} · {shipment.order.client.name} · {shipment.order.warehouse.stc_reference_name}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/shipments/${shipment.id}/edi214`} download>
              <Download className="h-4 w-4 mr-1" />EDI 214
            </a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-xs text-slate-500 uppercase">Carrier</div>
          <div className="text-lg font-semibold mt-1">{shipment.carrier ?? '—'}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-xs text-slate-500 uppercase">PRO #</div>
          <div className="text-lg font-semibold mt-1 font-mono">{shipment.pro_number ?? '—'}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-xs text-slate-500 uppercase">Pallets</div>
          <div className="text-3xl font-bold mt-1">{totalPallets}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-xs text-slate-500 uppercase">Total Weight</div>
          <div className="text-3xl font-bold mt-1">{totalWeight > 0 ? `${totalWeight} lbs` : '—'}</div>
        </div>
      </div>

      {shipment.order.store && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="text-sm font-semibold text-blue-900 mb-1">Consignee</div>
          <div className="text-sm text-blue-800">
            Kroger Store #{shipment.order.store.store_num}<br />
            {shipment.order.store.address}<br />
            {shipment.order.store.city}, {shipment.order.store.state} {shipment.order.store.zip}<br />
            Airport: <strong>{shipment.order.store.airport_code}</strong>
          </div>
        </div>
      )}

      {/* Order Lines Summary */}
      {shipment.order.lines.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b font-semibold text-slate-900">Order Lines</div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Ordered</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Shipped</th>
              </tr>
            </thead>
            <tbody>
              {shipment.order.lines.map(line => (
                <tr key={line.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs font-medium">{line.sku.code}</td>
                  <td className="px-4 py-3 text-slate-600">{line.sku.description}</td>
                  <td className="px-4 py-3 text-right">{line.ordered_qty}</td>
                  <td className="px-4 py-3 text-right font-medium">{line.shipped}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pallet Manifest */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b font-semibold text-slate-900">Pallet Manifest</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Pallet</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Dims (L×W×H)</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Weight</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Shrink Wrap</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Contents</th>
            </tr>
          </thead>
          <tbody>
            {pallets.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No pallets on this shipment
                </td>
              </tr>
            ) : pallets.map(p => (
              <tr key={p.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3 font-mono text-xs font-medium">{p.code}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {p.length && p.width && p.height
                    ? `${p.length}×${p.width}×${p.height}"`
                    : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {p.weight_lbs ? `${p.weight_lbs} lbs` : '—'}
                </td>
                <td className="px-4 py-3">{p.shrink_wrapped ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {p.items.map(i => `${i.sku.code}(${i.qty})`).join(', ') || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 bg-slate-50 border-t text-xs text-slate-500">
          {totalPallets} pallets · {totalWeight > 0 ? `${totalWeight} lbs total` : 'weight not recorded'}
        </div>
      </div>
    </div>
  )
}
