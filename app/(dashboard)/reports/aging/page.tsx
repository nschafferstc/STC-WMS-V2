import React from 'react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function AgingReportPage({ searchParams }: { searchParams: { warehouse_id?: string; client_id?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const warehouseId = (session.user as any)?.warehouseId
  const where: any = {}
  if (warehouseId) where.warehouse_id = warehouseId
  if (searchParams.warehouse_id) where.warehouse_id = parseInt(searchParams.warehouse_id)
  if (searchParams.client_id) where.sku = { client_id: parseInt(searchParams.client_id) }

  const lots = await prisma.inventoryLot.findMany({
    where,
    include: { sku: { include: { client: true } }, warehouse: true },
    orderBy: { received_date: 'asc' },
  })

  const warehouses = await prisma.warehouse.findMany({ orderBy: { code: 'asc' } })
  const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } })

  const now = new Date()
  const rows = lots.map(lot => {
    const days = Math.floor((now.getTime() - lot.received_date.getTime()) / (1000 * 60 * 60 * 24))
    return { ...lot, days_on_hand: days }
  })

  const bucket = (d: number) => d <= 30 ? '0-30' : d <= 60 ? '31-60' : d <= 90 ? '61-90' : '90+'
  const bucketColor = (d: number) => d <= 30 ? 'text-green-700' : d <= 60 ? 'text-yellow-700' : d <= 90 ? 'text-orange-600' : 'text-red-700'
  const bucketBg = (d: number) => d <= 30 ? '' : d <= 60 ? 'bg-yellow-50/30' : d <= 90 ? 'bg-orange-50/40' : 'bg-red-50/40'

  const totalUnits = rows.reduce((s, r) => s + r.qty, 0)
  const over90 = rows.filter(r => r.days_on_hand > 90).reduce((s, r) => s + r.qty, 0)
  const over60 = rows.filter(r => r.days_on_hand > 60).reduce((s, r) => s + r.qty, 0)

  return (
    <div>
      <Link href="/reports" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Reports
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Inventory Aging Report</h1>
      <p className="text-sm text-slate-500 mb-6">Days inventory has been on-hand by lot, sorted oldest first</p>

      {/* Filters */}
      <form className="flex gap-3 mb-6">
        <select name="warehouse_id" defaultValue={searchParams.warehouse_id}
          className="h-9 rounded border border-slate-200 px-2 text-sm bg-white">
          <option value="">All Warehouses</option>
          {warehouses.map(w => <option key={w.id} value={w.id}>{w.stc_reference_name}</option>)}
        </select>
        <select name="client_id" defaultValue={searchParams.client_id}
          className="h-9 rounded border border-slate-200 px-2 text-sm bg-white">
          <option value="">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="submit" className="h-9 px-4 rounded bg-slate-700 text-white text-sm">Filter</button>
      </form>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4 border-l-4 border-l-blue-400">
          <div className="text-xs text-slate-500 uppercase font-medium">Total Units On Hand</div>
          <div className="text-3xl font-bold mt-1">{totalUnits.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border p-4 border-l-4 border-l-orange-400">
          <div className="text-xs text-slate-500 uppercase font-medium">Units 60+ Days</div>
          <div className="text-3xl font-bold mt-1 text-orange-600">{over60.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border p-4 border-l-4 border-l-red-400">
          <div className="text-xs text-slate-500 uppercase font-medium">Units 90+ Days</div>
          <div className="text-3xl font-bold mt-1 text-red-700">{over90.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Client</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Warehouse</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Received</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Days On Hand</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Bucket</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No inventory lot data found</td></tr>
            ) : rows.map(row => (
              <tr key={row.id} className={`border-b border-slate-50 last:border-0 ${bucketBg(row.days_on_hand)}`}>
                <td className="px-4 py-3">
                  <div className="font-mono text-xs font-medium">{row.sku.code}</div>
                  <div className="text-xs text-slate-500">{row.sku.description.slice(0, 40)}</div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{row.sku.client.name}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{row.warehouse.stc_reference_name}</td>
                <td className="px-4 py-3 text-right font-medium">{row.qty.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs">{new Date(row.received_date).toLocaleDateString()}</td>
                <td className={`px-4 py-3 text-right font-bold ${bucketColor(row.days_on_hand)}`}>{row.days_on_hand}</td>
                <td className="px-4 py-3 text-xs font-medium">{bucket(row.days_on_hand)} days</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 bg-slate-50 border-t text-xs text-slate-500">{rows.length} lots</div>
      </div>
    </div>
  )
}
