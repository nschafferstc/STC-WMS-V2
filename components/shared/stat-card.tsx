import React from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  trend?: number
  trendLabel?: string
  status?: 'good' | 'warning' | 'danger' | 'info' | 'default'
  href?: string
  icon?: React.ElementType
  subtitle?: string
}

const statusColors = {
  good: 'border-l-green-500',
  warning: 'border-l-yellow-500',
  danger: 'border-l-red-500',
  info: 'border-l-blue-500',
  default: 'border-l-slate-300',
}

export function StatCard({ title, value, trend, trendLabel, status = 'default', href, icon: Icon, subtitle }: StatCardProps) {
  const content = (
    <div className={cn(
      'bg-white rounded-lg border border-slate-200 p-5 border-l-4',
      statusColors[status],
      href && 'cursor-pointer hover:shadow-md transition-shadow'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="p-2 bg-slate-100 rounded-lg ml-3 flex-shrink-0">
            <Icon className="h-5 w-5 text-slate-500" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-3">
          {trend > 0 ? (
            <TrendingUp className="h-3 w-3 text-green-600" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span className={cn('text-xs font-medium', trend > 0 ? 'text-green-600' : 'text-red-500')}>
            {trend > 0 ? '+' : ''}{trend}
          </span>
          {trendLabel && <span className="text-xs text-slate-500">{trendLabel}</span>}
        </div>
      )}
    </div>
  )

  if (href) return <Link href={href}>{content}</Link>
  return content
}
