import React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const STATUS_STYLES: Record<string, string> = {
  // Green
  COMPLETE: 'bg-green-100 text-green-800 border-green-200',
  READY: 'bg-green-100 text-green-800 border-green-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  RECEIVED: 'bg-green-100 text-green-800 border-green-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  RESOLVED: 'bg-green-100 text-green-800 border-green-200',
  // Yellow
  IN_TRANSIT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PARTIAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PENDING_PICKUP: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  SCHEDULED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  // Red
  AT_RISK: 'bg-red-100 text-red-800 border-red-200',
  DISCREPANCY: 'bg-red-100 text-red-800 border-red-200',
  QUARANTINED: 'bg-red-100 text-red-800 border-red-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  OPEN: 'bg-red-100 text-red-800 border-red-200',
  EXCEPTION: 'bg-red-100 text-red-800 border-red-200',
  // Blue
  ALLOCATED: 'bg-blue-100 text-blue-800 border-blue-200',
  EXPECTED: 'bg-blue-100 text-blue-800 border-blue-200',
  // Gray
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  CANCELLED: 'bg-slate-100 text-slate-700 border-slate-200',
  INACTIVE: 'bg-slate-100 text-slate-700 border-slate-200',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_PICKUP: 'Pending Pickup',
  IN_TRANSIT: 'In Transit',
  AT_RISK: 'At Risk',
  UNDER_REVIEW: 'Under Review',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-700 border-slate-200'
  const label = STATUS_LABELS[status] ?? status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ')
  return (
    <Badge variant="outline" className={cn('font-medium border text-xs', style, className)}>
      {label}
    </Badge>
  )
}
