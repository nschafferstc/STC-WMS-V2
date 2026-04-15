import React from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Package, Activity, Clock, TrendingUp } from 'lucide-react'

export default async function ReportsPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const reports = [
    { href: '/reports/inventory', title: 'Inventory Snapshot', description: 'Current on-hand quantities across all warehouses and SKUs', icon: Package, color: '#1a2744' },
    { href: '/reports/activity', title: 'Activity Report', description: 'ASNs, orders, receipts, transfers and returns over a date range', icon: Activity, color: '#f4811f' },
    { href: '/reports/aging', title: 'Inventory Aging', description: 'Days on hand by lot — identify slow-moving and at-risk inventory (30/60/90+ day buckets)', icon: Clock, color: '#d97706' },
    { href: '/reports/velocity', title: 'Stock Velocity', description: 'Fast vs slow movers based on actual shipments. Rank SKUs by units shipped in any period', icon: TrendingUp, color: '#16a34a' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Operational visibility and data exports</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(r => {
          const Icon = r.icon
          return (
            <Link key={r.href} href={r.href} className="bg-white rounded-lg border border-slate-200 p-6 hover:border-slate-300 hover:shadow-sm transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg" style={{ background: r.color + '15' }}>
                  <Icon className="h-5 w-5" style={{ color: r.color }} />
                </div>
                <h3 className="font-semibold text-slate-900 group-hover:text-blue-600">{r.title}</h3>
              </div>
              <p className="text-sm text-slate-500">{r.description}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
