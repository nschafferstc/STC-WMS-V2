import React from 'react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function VelocityReportPage({ searchParams }: { searchParams: { days?: string; warehouse_id?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const days = parseInt(searchParams.days ?? '30')
  const warehouseId = (session.user as any)?.warehouseId
  const since = new Date()
  since.setDate(since.getDate() - days)

  const warehouseFilter = warehouseId ?? (searchParams.warehouse_id ? parseInt(searchParams.warehouse_id) : undefined)
  const warehouses = await prisma.warehouse.findMany({ orderBy: { code: 'asc' } })

  const orderLines = await prisma.orderLine.findMany({
    where: {
      order: {
        status: 'COMPLETE',
        updatedAt: { gte: since },
        ...(warehouseFilter ? { warehouse_id: warehouseFilter } : {}),
      },
    },
    include: {
      sku: { include: { client: true } },
      order: { include: { warehouse: true } },
    },
  })

  // Aggregate by SKU
  const skuMap: Record<number, any> = {}
  for (const line of orderLines) {
    if (!skuMap[line.sku_id]) {
      skuMap[line.sku_id] = {
        sku_code: line.sku.code,
        sku_description: line.sku.description,
        client: line.sku.client.name,
        warehouse: line.order.warehouse.stc_reference_name,
        units_shipped: 0,
        order_count: 0,
      }
    }
    skuMap[line.sku_id].units_shipped += line.shipped
    skuMap[line.sku_id].order_count += 1
  }

  const rows = Object.entries(skuMap)
    .map(([sku_id, data]) => ({
      sku_id: parseInt(sku_id),
      ...data,
      units_per_day: Math.round((data.units_shipped / days) * 10) / 10,
    }))
    .sort((a, b) => b.units_shipped - a.units_shipped)

  const velocityLabel = (units: number) =>
    units === 0 ? 'Dead' : units < 10 ? 'Slow' : units < 50 ? 'Moderate' : 'Fast'
  const velocityColor = (units: number) =>
    units === 0 ? 'text-slate-400' : units < 10 ? 'text-yellow-600' : units < 50 ? 'text-blue-600' : 'text-green-700'
  const velocityBg = (units: number) =>
    units === 0 ? 'bg-slate-50' : units < 10 ? 'bg-yellow-50' : units < 50 ? 'bg-blue-50' : 'bg-green-50'

  const fastMovers = rows.filter(r => r.units_shipped >= 50).length
  const slowMovers = rows.filter(r => r.units_shipped > 0 && r.units_shipped < 10).length
  const totalUnits = rows.reduce((s, r) => s + r.units_shipped, 0)

  const dayOptions = [7, 14, 30, 60, 90]

  return (
    <div>
      <Link href="/reports" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Reports
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Stock Velocity Report</h1>
      <p className="text-sm text-slate-500 mb-6">SKU movement based on completed shipments in the selected period</p>

      {/* Period + Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex gap-2">
          {dayOptions.map(d => (
            <Link
              key={d}
              href={`/reports/velocity?days=${d}${searchParams.warehouse_id ? `&warehouse_id=${searchParams.warehouse_id}` : ''}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                days === d
                  ? 'bg-[#1a2744] text-white border-[#1a2744]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {d} days
            </Link>
          ))}
        </div>
        <form className="flex gap-2">
          <input type="hidden" name="days" value={days} />
          <select name="warehouse_id" defaultValue={searchParams.warehouse_id}
            className="h-8 rounded border border-slate-200 px-2 text-xs bg-white">
            <option value="">All Warehouses</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.stc_reference_name}</option>)}
          </select>
          <button type="submit" className="h-8 px-3 rounded bg-slate-700 text-white text-xs">Filter</button>
        </form>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4 border-l-4 border-l-blue-400">
          <div className="text-xs text-slate-500 uppercase font-medium">Units Shipped ({days}d)</div>
          <div className="text-3xl font-bold mt-1">{totalUnits.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border p-4 border-l-4 border-l-green-400">
          <div className="text-xs text-slate-500 uppercase font-medium">Fast Movers (50+ units)</div>
          <div className="text-3xl font-bold mt-1 text-green-700">{fastMovers}</div>
        </div>
        <div className="bg-white rounded-lg border p-4 border-l-4 border-l-yellow-400">
          <div className="text-xs text-slate-500 uppercase font-medium">Slow Movers (&lt;10 units)</div>
          <div className="text-3xl font-bold mt-1 text-yellow-600">{slowMovers}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Client</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Units Shipped</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Orders</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Units/Day</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Velocity</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No shipped orders in this period</td></tr>
            ) : rows.map((row, idx) => (
              <tr key={row.sku_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-400 font-mono text-xs">#{idx + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-mono text-xs font-medium">{row.sku_code}</div>
                  <div className="text-xs text-slate-500">{row.sku_description?.slice(0, 40)}</div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{row.client}</td>
                <td className="px-4 py-3 text-right font-bold">{row.units_shipped.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-slate-500">{row.order_count}</td>
                <td className="px-4 py-3 text-right text-slate-600">{row.units_per_day}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${velocityBg(row.units_shipped)} ${velocityColor(row.units_shipped)}`}>
                    {velocityLabel(row.units_shipped)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 bg-slate-50 border-t text-xs text-slate-500">{rows.length} SKUs · Last {days} days</div>
      </div>
    </div>
  )
}
