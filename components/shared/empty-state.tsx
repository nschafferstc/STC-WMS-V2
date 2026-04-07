import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ElementType
  action?: { label: string; href?: string; onClick?: () => void }
  className?: string
}

export function EmptyState({ title, description, icon: Icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {Icon && (
        <div className="p-4 bg-slate-100 rounded-full mb-4">
          <Icon className="h-8 w-8 text-slate-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm">{description}</p>
      {action && (
        <div className="mt-4">
          {action.href ? (
            <Button asChild style={{ background: '#1a2744', color: 'white' }}>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button onClick={action.onClick} style={{ background: '#1a2744', color: 'white' }}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
