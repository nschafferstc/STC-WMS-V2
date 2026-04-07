import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PageHeader } from '@/components/shared/page-header'
import { getInventoryAgeDays, formatDate } from '@/lib/utils'

export default async function InventoryLotsPage() {
  const session = await getServerSession(authOptions)
  const warehouseId = (session?.user as any)?.warehouseId

  const lots = await prisma.inventoryLot.findMany({
    where: warehouseId ? { warehouse_id: warehouseId } : undefined,
    include: { sku: { include: { client: true } }, warehouse: true },
    orderBy: { received_date: 'asc' },
  })

  const AGING_THRESHOLD = 90 // days default

  return (
    <div>
      <PageHeader title="Inventory Lots" description="Lot-level receiving and aging tracking" />
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Lot ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Client</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Warehouse</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Received</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Age (days)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {lots.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                  No inventory lots found
                </td>
              </tr>
            ) : lots.map(lot => {
              const age = getInventoryAgeDays(lot.received_date)
              const isAging = age > AGING_THRESHOLD
              const isApproaching = !isAging && age > 60
              return (
                <tr
                  key={lot.id}
                  className={`border-b border-slate-50 last:border-0 hover:bg-slate-50 ${isAging ? 'bg-red-50/30' : isApproaching ? 'bg-yellow-50/20' : ''}`}
                >
                  <td className="px-4 py-3 font-mono text-xs">LOT-{String(lot.id).padStart(5, '0')}</td>
                  <td className="px-4 py-3 font-mono text-xs font-medium">{lot.sku.code}</td>
                  <td className="px-4 py-3 text-slate-600">{lot.sku.description}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{lot.sku.client.name}</td>
                  <td className="px-4 py-3 text-slate-600">{lot.warehouse.stc_reference_name}</td>
                  <td className="px-4 py-3 text-right font-medium">{lot.qty}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(lot.received_date)}</td>
                  <td className={`px-4 py-3 text-right font-bold ${isAging ? 'text-red-600' : isApproaching ? 'text-yellow-600' : 'text-green-700'}`}>
                    {age}
                  </td>
                  <td className="px-4 py-3">
                    {isAging ? (
                      <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        Aging
                      </span>
                    ) : isApproaching ? (
                      <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                        Approaching
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        Fresh
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-4 py-2 bg-slate-50 border-t text-xs text-slate-500">
          {lots.length} lots
        </div>
      </div>
    </div>
  )
}
