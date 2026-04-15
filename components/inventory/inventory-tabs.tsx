'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/inventory', label: 'Stock Levels' },
  { href: '/inventory/lots', label: 'Lots' },
  { href: '/inventory/adjust', label: 'Adjustments' },
  { href: '/inventory/cycle-count', label: 'Cycle Counts' },
]

export function InventoryTabs() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 mb-6 border-b border-slate-200">
      {TABS.map(tab => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              isActive
                ? 'border-[#1a2744] text-[#1a2744]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
