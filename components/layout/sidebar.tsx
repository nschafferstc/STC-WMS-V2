'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ClipboardList, ArrowDownToLine, Ship, Settings,
  AlertTriangle, BoxIcon, ArrowLeftRight, RotateCcw, BarChart3, MonitorDot
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles?: string[]
}

const navItems: NavItem[] = [
  // STC staff see Command Center as home
  { href: '/command-center', label: 'Command Center', icon: MonitorDot, roles: ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR'] },
  // Warehouse ops / client users see Dashboard instead
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['WAREHOUSE_OPS', 'CLIENT_USER', 'STC_READ_ONLY'] },
  // Core operations — visible to all authenticated users
  { href: '/receiving', label: 'Receiving', icon: ArrowDownToLine },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
  { href: '/inventory', label: 'Inventory', icon: BoxIcon },
  { href: '/shipments', label: 'Shipments', icon: Ship },
  { href: '/transfers', label: 'Transfers', icon: ArrowLeftRight, roles: ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR'] },
  { href: '/returns', label: 'Returns', icon: RotateCcw },
  { href: '/discrepancies', label: 'Discrepancies', icon: AlertTriangle },
  // Analytics & Admin
  { href: '/reports', label: 'Reports', icon: BarChart3, roles: ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR'] },
  { href: '/admin', label: 'Admin', icon: Settings, roles: ['STC_EXECUTIVE', 'STC_OPS_MANAGER'] },
]

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname()

  const visibleItems = navItems.filter(item =>
    !item.roles || (role && item.roles.includes(role))
  )

  return (
    <div className="w-56 flex-shrink-0 flex flex-col bg-[#1a2744] text-white">
      <div className="p-4 border-b border-white/10">
        <div className="text-white font-bold text-lg tracking-tight">STC Logistics</div>
        <div className="text-[#f4811f] text-xs font-medium tracking-widest uppercase mt-0.5">WMS</div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-white/10 text-xs text-slate-500">
        WMS v2.3
      </div>
    </div>
  )
}
