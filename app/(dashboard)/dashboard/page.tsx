import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StatCard } from '@/components/shared/stat-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { FolderKanban, ClipboardList, Truck, AlertTriangle, Package, ArrowDownToLine } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role ?? ''
  const warehouseId = (session?.user as any)?.warehouseId

  // Build where clause based on role
  const orderWhere = warehouseId ? { warehouse_id: warehouseId } : {}

  const [
    projectCount,
    openOrderCount,
    readyOrderCount,
    discrepancyCount,
    quarantineCount,
    asnInTransitCount,
    recentReceipts,
    recentReadyOrders,
    recentDiscrepancies,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.order.count({ where: { ...orderWhere, status: { notIn: ['COMPLETE', 'CANCELLED'] } } }),
    prisma.order.count({ where: { ...orderWhere, status: 'READY' } }),
    prisma.discrepancy.count({ where: { status: 'OPEN' } }),
    prisma.package.count({ where: { ...(warehouseId ? { warehouse_id: warehouseId } : {}), status: 'QUARANTINED' } }),
    prisma.aSN.count({ where: { ...(warehouseId ? { warehouse_id: warehouseId } : {}), status: 'IN_TRANSIT' } }),
    prisma.inboundReceipt.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        asn: { include: { warehouse: true, client: true } },
      },
    }),
    prisma.order.findMany({
      take: 8,
      where: { ...orderWhere, status: { in: ['READY', 'AT_RISK'] } },
      orderBy: { updatedAt: 'desc' },
      include: { client: true, warehouse: true },
    }),
    prisma.discrepancy.findMany({
      take: 5,
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const stats = [
    { title: 'Active Projects', value: projectCount, icon: FolderKanban, href: '/projects', status: 'info' as const },
    { title: 'Open Orders', value: openOrderCount, icon: ClipboardList, href: '/orders', status: openOrderCount > 10 ? 'warning' as const : 'default' as const },
    { title: 'Ready for Pickup', value: readyOrderCount, icon: Truck, href: '/orders?status=READY', status: readyOrderCount > 0 ? 'good' as const : 'default' as const },
    { title: 'Open Discrepancies', value: discrepancyCount, icon: AlertTriangle, href: '/discrepancies', status: discrepancyCount > 0 ? 'danger' as const : 'good' as const },
    { title: 'Pending Approvals', value: quarantineCount, icon: Package, href: '/packages', status: quarantineCount > 0 ? 'warning' as const : 'default' as const },
    { title: 'ASNs In Transit', value: asnInTransitCount, icon: ArrowDownToLine, href: '/receiving', status: 'info' as const },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">STC Logistics — Operations Overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {stats.map(stat => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Receipts */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Recent Receiving Events</h2>
            <Link href="/receiving" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentReceipts.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-400 text-center">No recent receipts</p>
            ) : recentReceipts.map(r => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <div className="text-sm font-medium text-slate-800">{r.asn.code}</div>
                  <div className="text-xs text-slate-500">{r.asn.warehouse.stc_reference_name} · {r.asn.client.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  <span className="text-xs text-slate-400">{formatDateTime(r.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders Ready/At Risk */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Orders Needing Attention</h2>
            <Link href="/orders" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentReadyOrders.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-400 text-center">No orders need attention</p>
            ) : recentReadyOrders.map(o => (
              <Link key={o.id} href={`/orders/${o.id}`} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 block">
                <div>
                  <div className="text-sm font-medium text-slate-800">{o.code}</div>
                  <div className="text-xs text-slate-500">{o.client.name} · {o.warehouse.stc_reference_name}</div>
                </div>
                <StatusBadge status={o.status} />
              </Link>
            ))}
          </div>
        </div>

        {/* Open Discrepancies */}
        {recentDiscrepancies.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden lg:col-span-2">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Open Discrepancies</h2>
              <Link href="/discrepancies" className="text-xs text-blue-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-slate-50">
              {recentDiscrepancies.map(d => (
                <div key={d.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{d.type.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-slate-500">{d.source_ref} — {d.description.slice(0, 60)}{d.description.length > 60 ? '...' : ''}</div>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
