import React from 'react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StatusBadge } from '@/components/shared/status-badge'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import {
  ClipboardList, AlertTriangle, Clock, CheckCircle2,
  Building2, TrendingUp, Package, Zap, ArrowRight
} from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function CommandCenterPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role

  // Only STC staff
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR'].includes(role)) {
    redirect('/dashboard')
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // ── Data fetches ──────────────────────────────────────────────────────────
  const [
    allActiveOrders,
    pendingReview,
    sentToWarehouse,
    warehouseConfirmed,
    openDiscrepancies,
    todayASNs,
    todayShipments,
    lowStockItems,
    priorityOrders,
    recentAudit,
  ] = await Promise.all([
    // Active orders (everything except COMPLETE and CANCELLED)
    prisma.order.findMany({
      where: { status: { notIn: ['COMPLETE', 'CANCELLED'] } },
      include: { client: true, warehouse: true, store: true, lines: true },
      orderBy: [{ is_priority: 'desc' }, { updatedAt: 'desc' }],
      take: 50,
    }),
    // Orders pending manager review
    prisma.order.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: { client: true, warehouse: true },
      orderBy: { submitted_at: 'asc' },
    }),
    // Orders sent to warehouse (awaiting confirmation)
    prisma.order.findMany({
      where: { status: 'SENT_TO_WAREHOUSE' },
      include: { client: true, warehouse: true },
      orderBy: { sent_to_warehouse_at: 'asc' },
    }),
    // Orders warehouse confirmed (in progress at warehouse)
    prisma.order.count({ where: { status: 'WAREHOUSE_CONFIRMED' } }),
    // Open discrepancies
    prisma.discrepancy.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    // ASNs expected today
    prisma.aSN.count({
      where: {
        expected_date: { gte: todayStart },
        status: { notIn: ['RECEIVED', 'CANCELLED'] },
      },
    }),
    // Shipments created today
    prisma.shipment.count({ where: { createdAt: { gte: todayStart } } }),
    // Low/out of stock
    prisma.inventory.findMany({
      where: { on_hand: { lte: 0 } },
      include: { sku: { include: { client: true } }, warehouse: true },
      take: 8,
      orderBy: { on_hand: 'asc' },
    }),
    // Priority orders not complete
    prisma.order.count({ where: { is_priority: true, status: { notIn: ['COMPLETE', 'CANCELLED'] } } }),
    // Recent audit log
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ])

  // KPI calculations
  const pendingReviewCount = pendingReview.length
  const sentToWarehouseCount = sentToWarehouse.length
  const overdueConfirmations = sentToWarehouse.filter(o =>
    o.sent_to_warehouse_at && o.sent_to_warehouse_at < oneDayAgo
  )
  const readyCount = allActiveOrders.filter(o => o.status === 'READY').length
  const atRiskCount = allActiveOrders.filter(o => o.status === 'AT_RISK').length

  // KPI cards config
  const kpis = [
    {
      label: 'Active Orders',
      value: allActiveOrders.length,
      sub: `${priorityOrders} priority`,
      color: 'border-l-blue-500',
      textColor: 'text-blue-700',
      href: '/orders',
      icon: ClipboardList,
    },
    {
      label: 'Pending Review',
      value: pendingReviewCount,
      sub: 'awaiting manager approval',
      color: pendingReviewCount > 0 ? 'border-l-orange-500' : 'border-l-slate-300',
      textColor: pendingReviewCount > 0 ? 'text-orange-700' : 'text-slate-700',
      href: '/orders?status=PENDING_REVIEW',
      icon: Clock,
      urgent: pendingReviewCount > 0,
    },
    {
      label: 'Awaiting WH Confirmation',
      value: sentToWarehouseCount,
      sub: overdueConfirmations.length > 0 ? `${overdueConfirmations.length} overdue >24h` : 'sent to warehouse',
      color: overdueConfirmations.length > 0 ? 'border-l-red-500' : sentToWarehouseCount > 0 ? 'border-l-yellow-500' : 'border-l-slate-300',
      textColor: overdueConfirmations.length > 0 ? 'text-red-700' : 'text-yellow-700',
      href: '/orders?status=SENT_TO_WAREHOUSE',
      icon: Building2,
      urgent: overdueConfirmations.length > 0,
    },
    {
      label: 'WH In Progress',
      value: warehouseConfirmed,
      sub: 'confirmed by warehouse',
      color: 'border-l-purple-500',
      textColor: 'text-purple-700',
      href: '/orders?status=WAREHOUSE_CONFIRMED',
      icon: Package,
    },
    {
      label: 'Ready for Pickup',
      value: readyCount,
      sub: 'fully picked & packed',
      color: readyCount > 0 ? 'border-l-green-500' : 'border-l-slate-300',
      textColor: 'text-green-700',
      href: '/orders?status=READY',
      icon: CheckCircle2,
    },
    {
      label: 'At Risk',
      value: atRiskCount,
      sub: 'need immediate attention',
      color: atRiskCount > 0 ? 'border-l-red-500' : 'border-l-slate-300',
      textColor: 'text-red-700',
      href: '/orders?status=AT_RISK',
      icon: AlertTriangle,
      urgent: atRiskCount > 0,
    },
    {
      label: 'Open Discrepancies',
      value: openDiscrepancies.length,
      sub: 'unresolved exceptions',
      color: openDiscrepancies.length > 0 ? 'border-l-red-500' : 'border-l-slate-300',
      textColor: openDiscrepancies.length > 0 ? 'text-red-700' : 'text-slate-700',
      href: '/discrepancies?status=OPEN',
      icon: AlertTriangle,
    },
    {
      label: "Today's Activity",
      value: todayASNs + todayShipments,
      sub: `${todayASNs} receiving · ${todayShipments} shipments`,
      color: 'border-l-teal-500',
      textColor: 'text-teal-700',
      href: '/shipments',
      icon: TrendingUp,
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Command Center</h1>
          <p className="text-sm text-slate-500 mt-1">
            {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}Live operational overview
          </p>
        </div>
      </div>

      {/* ── KPI Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {kpis.map(kpi => {
          const Icon = kpi.icon
          return (
            <Link key={kpi.label} href={kpi.href}
              className={`bg-white rounded-lg border p-4 border-l-4 ${kpi.color} hover:shadow-md transition-shadow ${kpi.urgent ? 'ring-1 ring-orange-300' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-slate-500 uppercase font-medium">{kpi.label}</div>
                <Icon className={`h-4 w-4 ${kpi.textColor} opacity-60`} />
              </div>
              <div className={`text-3xl font-bold ${kpi.textColor}`}>{kpi.value}</div>
              <div className="text-xs text-slate-400 mt-1">{kpi.sub}</div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* ── Orders Pending Manager Review ──────────────────────────── */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900">Pending Manager Approval</div>
              <div className="text-xs text-slate-500 mt-0.5">Submitted by coordinators, awaiting your sign-off</div>
            </div>
            {pendingReviewCount > 0 && (
              <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">
                {pendingReviewCount} waiting
              </span>
            )}
          </div>
          {pendingReview.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">No orders pending review</div>
          ) : (
            <div className="divide-y">
              {pendingReview.map(o => (
                <Link key={o.id} href={`/orders/${o.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-orange-50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      {o.is_priority && <Zap className="h-3 w-3 text-orange-500" />}
                      <span className="font-mono text-sm font-medium text-slate-800">{o.code}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {o.client.name} · {o.warehouse.stc_reference_name}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div className="text-xs text-slate-400">
                      {o.submitted_at ? `Submitted ${formatDate(o.submitted_at)}` : '—'}
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                  </div>
                </Link>
              ))}
            </div>
          )}
          {pendingReview.length > 0 && (
            <div className="px-5 py-2 bg-slate-50 border-t">
              <Link href="/orders?status=PENDING_REVIEW" className="text-xs text-blue-600 hover:underline">
                View all pending review →
              </Link>
            </div>
          )}
        </div>

        {/* ── Awaiting Warehouse Confirmation ───────────────────────── */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900">Awaiting Warehouse Confirmation</div>
              <div className="text-xs text-slate-500 mt-0.5">Sent to warehouse, confirmation not yet received</div>
            </div>
            {overdueConfirmations.length > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                {overdueConfirmations.length} overdue
              </span>
            )}
          </div>
          {sentToWarehouse.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">All orders confirmed</div>
          ) : (
            <div className="divide-y">
              {sentToWarehouse.map(o => {
                const isOverdue = o.sent_to_warehouse_at && o.sent_to_warehouse_at < oneDayAgo
                return (
                  <Link key={o.id} href={`/orders/${o.id}`}
                    className={`flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors ${isOverdue ? 'bg-red-50/40' : ''}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        {isOverdue && <AlertTriangle className="h-3 w-3 text-red-500" />}
                        <span className="font-mono text-sm font-medium text-slate-800">{o.code}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {o.client.name} · {o.warehouse.stc_reference_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                        {o.sent_to_warehouse_at ? `Sent ${formatDate(o.sent_to_warehouse_at)}` : '—'}
                        {isOverdue && ' ⚠'}
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
          {sentToWarehouse.length > 0 && (
            <div className="px-5 py-2 bg-slate-50 border-t">
              <Link href="/orders?status=SENT_TO_WAREHOUSE" className="text-xs text-blue-600 hover:underline">
                View all sent to warehouse →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── All Active Orders Table ───────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <div className="font-semibold text-slate-900">All Active Orders</div>
            <div className="text-xs text-slate-500 mt-0.5">{allActiveOrders.length} orders in progress across all warehouses</div>
          </div>
          <Link href="/orders" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            View full list <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Order</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Client</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Warehouse</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Lines</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Updated</th>
            </tr>
          </thead>
          <tbody>
            {allActiveOrders.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No active orders</td></tr>
            ) : allActiveOrders.map(o => (
              <tr key={o.id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50 ${o.status === 'AT_RISK' ? 'bg-red-50/20' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {o.is_priority && <Zap className="h-3 w-3 text-orange-500 flex-shrink-0" />}
                    <Link href={`/orders/${o.id}`} className="font-mono text-xs text-blue-600 hover:underline font-medium">
                      {o.code}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-700">{o.client.name}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{o.warehouse.stc_reference_name}</td>
                <td className="px-4 py-3 text-slate-600">{o.lines.length}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3 text-xs text-slate-400">{formatDate(o.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Open Discrepancies ───────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div className="font-semibold text-slate-900">Open Discrepancies</div>
            <Link href="/discrepancies?status=OPEN" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          {openDiscrepancies.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">No open discrepancies</div>
          ) : (
            <div className="divide-y">
              {openDiscrepancies.map(d => (
                <Link key={d.id} href={`/discrepancies/${d.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-red-50/30 transition-colors">
                  <div>
                    <div className="font-mono text-xs font-medium text-blue-600">DISC-{String(d.id).padStart(4, '0')}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{d.type.replace(/_/g, ' ')} · {d.source_ref}</div>
                  </div>
                  <div className="text-xs text-slate-400">{formatDate(d.createdAt)}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Out of Stock Alerts ──────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div className="font-semibold text-slate-900">Out of Stock Alerts</div>
            <Link href="/inventory" className="text-xs text-blue-600 hover:underline">View inventory →</Link>
          </div>
          {lowStockItems.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">No out-of-stock items</div>
          ) : (
            <div className="divide-y">
              {lowStockItems.map(inv => (
                <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="font-mono text-xs font-medium text-slate-800">{inv.sku.code}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {inv.sku.client.name} · {inv.warehouse.stc_reference_name}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    {inv.on_hand} on hand
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
