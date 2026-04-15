import React from 'react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { InventoryTabs } from '@/components/inventory/inventory-tabs'
import Link from 'next/link'

export default async function InventoryPage({ searchParams }: { searchParams: { warehouse?: string; search?: string; client_id?: string } }) {
  const session = await getServerSession(authOptions)
  const warehouseId = (session?.user as any)?.warehouseId

  const where: any = {}
  if (warehouseId) where.warehouse_id = warehouseId
  if (searchParams.warehouse) where.warehouse_id = parseInt(searchParams.warehouse)
  if (searchParams.client_id) where.sku = { client_id: parseInt(searchParams.client_id) }

  const [inventory, warehouses, clients] = await Promise.all([
    prisma.inventory.findMany({
      where,
      include: {
        sku: { include: { client: true } },
        warehouse: true,
      },
      orderBy: [{ warehouse: { code: 'asc' } }, { sku: { code: 'asc' } }],
    }),
    prisma.warehouse.findMany({
      where: warehouseId ? { id: warehouseId } : undefined,
      orderBy: { code: 'asc' },
    }),
    prisma.client.findMany({ orderBy: { name: 'asc' } }),
  ])

  // Apply search filter
  const filtered = searchParams.search
    ? inventory.filter(inv =>
        inv.sku.code.toLowerCase().includes(searchParams.search!.toLowerCase()) ||
        inv.sku.description.toLowerCase().includes(searchParams.search!.toLowerCase())
      )
    : inventory

  // Summary stats
  const totalSKUs = new Set(filtered.map(i => i.sku_id)).size
  const outOfStock = filtered.filter(i => i.on_hand - i.allocated <= 0).length
  const lowStock = filtered.filter(i => {
    const avail = i.on_hand - i.allocated
    return avail > 0 && i.sku.low_stock_threshold && avail <= i.sku.low_stock_threshold
  }).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time stock levels across all warehouses</p>
        </div>
        <div className="flex gap-2">
          <Link href="/inventory/cycle-count" className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cycle Count
          </Link>
          <Link href="/inventory/adjust" className="inline-flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium text-white" style={{ background: '#1a2744' }}>
            Adjust Stock
          </Link>
        </div>
      </div>

      <InventoryTabs />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4 border-l-4 border-l-blue-500">
          <div className="text-xs text-slate-500 uppercase font-medium">Total SKUs</div>
          <div className="text-3xl font-bold mt-1">{totalSKUs}</div>
        </div>
        <div className="bg-white rounded-lg border p-4 border-l-4 border-l-yellow-500">
          <div className="text-xs text-slate-500 uppercase font-medium">Low Stock</div>
          <div className="text-3xl font-bold mt-1 text-yellow-700">{lowStock}</div>
        </div>
        <div className="bg-white rounded-lg border p-4 border-l-4 border-l-red-500">
          <div className="text-xs text-slate-500 uppercase font-medium">Out of Stock</div>
          <div className="text-3xl font-bold mt-1 text-red-700">{outOfStock}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <form className="flex flex-wrap gap-2 items-center">
          <input
            name="search"
            defaultValue={searchParams.search}
            placeholder="Search SKU or description..."
            className="h-9 rounded border border-slate-200 bg-white px-2 text-sm w-56"
          />
          {!warehouseId && (
            <select
              name="warehouse"
              defaultValue={searchParams.warehouse}
              className="h-9 rounded border border-slate-200 bg-white px-2 text-sm"
            >
              <option value="">All Warehouses</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.stc_reference_name}</option>
              ))}
            </select>
          )}
          <select
            name="client_id"
            defaultValue={searchParams.client_id ?? ''}
            className="h-9 rounded border border-slate-200 bg-white px-2 text-sm"
          >
            <option value="">All Clients</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            type="submit"
            className="h-9 px-3 rounded bg-slate-700 text-white text-sm font-medium"
          >
            Filter
          </button>
          {(searchParams.client_id || searchParams.warehouse || searchParams.search) && (
            <a href="/inventory" className="h-9 px-3 flex items-center rounded border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
              Clear
            </a>
          )}
        </form>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Client</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Warehouse</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">On Hand</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Allocated</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Available</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Stock Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  No inventory records found
                </td>
              </tr>
            ) : filtered.map(inv => {
              const available = inv.on_hand - inv.allocated
              const isOut = available <= 0
              const isLow = !isOut && inv.sku.low_stock_threshold != null && available <= inv.sku.low_stock_threshold
              return (
                <tr
                  key={inv.id}
                  className={`border-b border-slate-50 last:border-0 hover:bg-slate-50 ${isOut ? 'bg-red-50/30' : isLow ? 'bg-yellow-50/30' : ''}`}
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">{inv.sku.code}</td>
                  <td className="px-4 py-3 text-slate-700">{inv.sku.description}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{inv.sku.client.name}</td>
                  <td className="px-4 py-3 text-slate-600">{inv.warehouse.stc_reference_name}</td>
                  <td className="px-4 py-3 text-right font-medium">{inv.on_hand}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{inv.allocated}</td>
                  <td className={`px-4 py-3 text-right font-bold text-lg ${isOut ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-green-700'}`}>
                    {available}
                  </td>
                  <td className="px-4 py-3">
                    {isOut ? (
                      <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        Out of Stock
                      </span>
                    ) : isLow ? (
                      <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                        Low Stock
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        In Stock
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-4 py-2 bg-slate-50 border-t text-xs text-slate-500">
          {filtered.length} records
        </div>
      </div>
    </div>
  )
}
