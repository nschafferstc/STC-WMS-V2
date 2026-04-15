import React from 'react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PageHeader } from '@/components/shared/page-header'

export default async function InventoryReportPage({ searchParams }: { searchParams: { warehouse_id?: string; client_id?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const [warehouses, clients] = await Promise.all([
    prisma.warehouse.findMany({ orderBy: { stc_reference_name: 'asc' } }),
    prisma.client.findMany({ orderBy: { name: 'asc' } }),
  ])

  const where: any = {}
  if (searchParams.warehouse_id) where.warehouse_id = parseInt(searchParams.warehouse_id)
  if (searchParams.client_id) where.sku = { client_id: parseInt(searchParams.client_id) }

  const inventory = await prisma.inventory.findMany({
    where,
    include: { warehouse: true, sku: { include: { client: true } } },
    orderBy: [{ warehouse_id: 'asc' }, { sku_id: 'asc' }],
  })

  const totalOnHand = inventory.reduce((s, i) => s + i.on_hand, 0)
  const totalAllocated = inventory.reduce((s, i) => s + i.allocated, 0)

  return (
    <div>
      <PageHeader title="Inventory Snapshot" description={`${inventory.length} SKU-location records — ${totalOnHand.toLocaleString()} units on hand`} />
      <div className="flex gap-3 mb-4">
        <form className="flex gap-2">
          <select name="warehouse_id" defaultValue={searchParams.warehouse_id ?? ''} className="border border-slate-300 rounded-md px-3 py-1.5 text-sm">
            <option value="">All Warehouses</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.stc_reference_name}</option>)}
          </select>
          <select name="client_id" defaultValue={searchParams.client_id ?? ''} className="border border-slate-300 rounded-md px-3 py-1.5 text-sm">
            <option value="">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="submit" className="px-4 py-1.5 bg-[#1a2744] text-white rounded-md text-sm">Filter</button>
        </form>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4"><div className="text-2xl font-bold text-slate-900">{totalOnHand.toLocaleString()}</div><div className="text-sm text-slate-500">Total On Hand</div></div>
        <div className="bg-white rounded-lg border border-slate-200 p-4"><div className="text-2xl font-bold text-slate-900">{totalAllocated.toLocaleString()}</div><div className="text-sm text-slate-500">Total Allocated</div></div>
        <div className="bg-white rounded-lg border border-slate-200 p-4"><div className="text-2xl font-bold text-slate-900">{(totalOnHand - totalAllocated).toLocaleString()}</div><div className="text-sm text-slate-500">Total Available</div></div>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Client</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Warehouse</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">On Hand</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Allocated</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Available</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No inventory records found</td></tr>
            ) : inventory.map(inv => (
              <tr key={inv.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3"><div className="font-mono text-xs text-slate-800">{inv.sku.code}</div><div className="text-xs text-slate-500">{inv.sku.description?.slice(0, 40)}</div></td>
                <td className="px-4 py-3 text-slate-600">{inv.sku.client.name}</td>
                <td className="px-4 py-3 text-slate-600">{inv.warehouse.stc_reference_name}</td>
                <td className="px-4 py-3 text-right font-medium">{inv.on_hand.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-amber-600">{inv.allocated.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-green-600 font-medium">{(inv.on_hand - inv.allocated).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
