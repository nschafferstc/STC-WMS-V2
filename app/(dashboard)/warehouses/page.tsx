import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PageHeader } from '@/components/shared/page-header'
import Link from 'next/link'
import { Warehouse, MapPin } from 'lucide-react'

export default async function WarehousesPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const warehouseId = (session?.user as any)?.warehouseId

  const warehouses = await prisma.warehouse.findMany({
    where: warehouseId ? { id: warehouseId } : undefined,
    include: {
      _count: {
        select: {
          orders: { where: { status: { notIn: ['COMPLETE', 'CANCELLED'] } } },
          inventory: true,
          asns: { where: { status: { in: ['SCHEDULED', 'IN_TRANSIT'] } } },
        },
      },
    },
    orderBy: { code: 'asc' },
  })

  const isAdmin = ['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes(role)

  return (
    <div>
      <PageHeader
        title="Warehouses"
        description="STC Logistics DC locations"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {warehouses.map(wh => (
          <Link key={wh.id} href={`/warehouses/${wh.id}`}>
            <div className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-[#1a2744]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs text-slate-500 font-medium mb-1">{wh.code}</div>
                  <h3 className="font-semibold text-slate-900">{wh.stc_reference_name}</h3>
                  {isAdmin && <div className="text-xs text-slate-400 mt-0.5">{wh.company_name}</div>}
                </div>
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Warehouse className="h-4 w-4 text-slate-500" />
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 mb-4">
                <MapPin className="h-3 w-3" />
                {wh.city}, {wh.state}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded p-2">
                  <div className="text-lg font-bold text-slate-800">{wh._count.orders}</div>
                  <div className="text-xs text-slate-500">Open Orders</div>
                </div>
                <div className="bg-slate-50 rounded p-2">
                  <div className="text-lg font-bold text-slate-800">{wh._count.asns}</div>
                  <div className="text-xs text-slate-500">Active ASNs</div>
                </div>
                <div className="bg-slate-50 rounded p-2">
                  <div className="text-lg font-bold text-slate-800">{wh._count.inventory}</div>
                  <div className="text-xs text-slate-500">SKUs</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
