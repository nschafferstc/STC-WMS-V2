'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileText, CheckCircle, Edit, XCircle, Zap, ClipboardList } from 'lucide-react'
import Link from 'next/link'

interface OrderActionsProps {
  order: { id: number; status: string; code: string; is_priority?: boolean }
  role?: string
}

export function OrderActions({ order, role }: OrderActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const canEdit = ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR'].includes(role ?? '')
  const isEditable = !['COMPLETE', 'CANCELLED'].includes(order.status)
  const isCancellable = !['COMPLETE', 'CANCELLED'].includes(order.status)

  const markReady = async () => {
    if (!confirm(`Mark order ${order.code} as READY? This will notify the team.`)) return
    setLoading('ready')
    const res = await fetch(`/api/orders/${order.id}/ready`, { method: 'POST' })
    if (res.ok) { router.refresh() } else { alert('Failed to update order status') }
    setLoading(null)
  }

  const cancelOrder = async () => {
    if (!confirm(`Cancel order ${order.code}? This will release any allocated inventory.`)) return
    setLoading('cancel')
    const res = await fetch(`/api/orders/${order.id}/cancel`, { method: 'POST' })
    if (res.ok) { router.refresh() } else {
      const data = await res.json()
      alert(data.error ?? 'Failed to cancel order')
    }
    setLoading(null)
  }

  const togglePriority = async () => {
    setLoading('priority')
    const res = await fetch(`/api/orders/${order.id}/priority`, { method: 'POST' })
    if (res.ok) { router.refresh() } else { alert('Failed to update priority') }
    setLoading(null)
  }

  const downloadPackList = () => window.open(`/api/orders/${order.id}/pack-list`, '_blank')
  const downloadBOL = () => window.open(`/api/orders/${order.id}/bol`, '_blank')

  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      {/* Priority toggle */}
      {canEdit && isEditable && (
        <Button
          variant="outline"
          size="sm"
          onClick={togglePriority}
          disabled={loading === 'priority'}
          className={order.is_priority ? 'border-orange-400 text-orange-600 bg-orange-50 hover:bg-orange-100' : ''}
        >
          <Zap className="h-4 w-4 mr-1" />
          {order.is_priority ? 'Priority ✓' : 'Set Priority'}
        </Button>
      )}

      {/* Edit */}
      {canEdit && isEditable && (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/orders/${order.id}/edit`}>
            <Edit className="h-4 w-4 mr-1" />Edit
          </Link>
        </Button>
      )}

      {/* Documents */}
      {['READY', 'COMPLETE'].includes(order.status) && (
        <>
          <Button variant="outline" size="sm" onClick={downloadPackList}>
            <ClipboardList className="h-4 w-4 mr-1" />Pick List
          </Button>
          <Button variant="outline" size="sm" onClick={downloadBOL}>
            <FileText className="h-4 w-4 mr-1" />BOL
          </Button>
        </>
      )}

      {/* Mark Ready */}
      {['ALLOCATED', 'PARTIAL'].includes(order.status) && (
        <Button size="sm" onClick={markReady} disabled={loading === 'ready'} style={{ background: '#1a2744', color: 'white' }}>
          <CheckCircle className="h-4 w-4 mr-1" />
          {loading === 'ready' ? 'Processing...' : 'Mark Ready'}
        </Button>
      )}

      {/* Cancel */}
      {canEdit && isCancellable && (
        <Button
          variant="outline"
          size="sm"
          onClick={cancelOrder}
          disabled={loading === 'cancel'}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <XCircle className="h-4 w-4 mr-1" />
          {loading === 'cancel' ? 'Cancelling...' : 'Cancel'}
        </Button>
      )}
    </div>
  )
}
