'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileText, CheckCircle, Edit, XCircle, Zap, ClipboardList, Send, Building2, ThumbsDown } from 'lucide-react'
import Link from 'next/link'

interface OrderActionsProps {
  order: { id: number; status: string; code: string; is_priority?: boolean }
  role?: string
}

export function OrderActions({ order, role }: OrderActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const isManager = ['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes(role ?? '')
  const isCoordinator = ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR'].includes(role ?? '')
  const isWarehouse = role === 'WAREHOUSE_OPS'
  const isEditable = !['COMPLETE', 'CANCELLED'].includes(order.status)

  const post = async (path: string, body?: object) => {
    return fetch(`/api/orders/${order.id}/${path}`, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  const handle = async (key: string, path: string, body?: object, confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return
    setLoading(key)
    const res = await post(path, body)
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? 'Action failed')
    }
    setLoading(null)
  }

  const submitForReview = () => handle('submit', 'submit-review', undefined, `Submit order ${order.code} for manager review?`)
  const approveOrder = () => handle('approve', 'approve', undefined, `Approve order ${order.code}?`)
  const rejectOrder = async () => {
    if (!rejectReason.trim()) { alert('Please enter a reason for rejection'); return }
    setLoading('reject')
    const res = await post('approve', { reject: true, reason: rejectReason })
    if (res.ok) { router.refresh() } else { alert('Failed to reject') }
    setLoading(null)
    setShowRejectForm(false)
  }
  const sendToWarehouse = () => handle('send', 'send-to-warehouse', undefined, `Send order ${order.code} to warehouse? The warehouse will receive a notification to confirm receipt.`)
  const warehouseConfirm = () => handle('whconfirm', 'warehouse-confirm', undefined, `Confirm receipt of order ${order.code} at your warehouse?`)
  const markReady = () => handle('ready', 'ready', undefined, `Mark order ${order.code} as READY for pickup?`)
  const cancelOrder = () => handle('cancel', 'cancel', undefined, `Cancel order ${order.code}? This will release any allocated inventory.`)
  const togglePriority = () => handle('priority', 'priority')
  const downloadPackList = () => window.open(`/api/orders/${order.id}/pack-list`, '_blank')
  const downloadBOL = () => window.open(`/api/orders/${order.id}/bol`, '_blank')

  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">

      {/* Priority toggle — STC staff on active orders */}
      {isCoordinator && isEditable && (
        <Button
          variant="outline" size="sm"
          onClick={togglePriority}
          disabled={loading === 'priority'}
          className={order.is_priority ? 'border-orange-400 text-orange-600 bg-orange-50 hover:bg-orange-100' : ''}
        >
          <Zap className="h-4 w-4 mr-1" />
          {order.is_priority ? 'Priority ✓' : 'Set Priority'}
        </Button>
      )}

      {/* Edit — only on DRAFT orders */}
      {isCoordinator && order.status === 'DRAFT' && (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/orders/${order.id}/edit`}><Edit className="h-4 w-4 mr-1" />Edit</Link>
        </Button>
      )}

      {/* ── WORKFLOW BUTTONS ───────────────────────────────────────── */}

      {/* DRAFT → Submit for Review */}
      {isCoordinator && order.status === 'DRAFT' && (
        <Button size="sm" onClick={submitForReview} disabled={loading === 'submit'}
          className="bg-orange-600 hover:bg-orange-700 text-white">
          <Send className="h-4 w-4 mr-1" />
          {loading === 'submit' ? 'Submitting...' : 'Submit for Review'}
        </Button>
      )}

      {/* PENDING_REVIEW → Approve or Reject (manager only) */}
      {isManager && order.status === 'PENDING_REVIEW' && !showRejectForm && (
        <>
          <Button size="sm" onClick={approveOrder} disabled={loading === 'approve'}
            className="bg-green-600 hover:bg-green-700 text-white">
            <CheckCircle className="h-4 w-4 mr-1" />
            {loading === 'approve' ? 'Approving...' : 'Approve'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowRejectForm(true)}
            className="text-red-600 border-red-200 hover:bg-red-50">
            <ThumbsDown className="h-4 w-4 mr-1" />Reject
          </Button>
        </>
      )}

      {/* Reject inline form */}
      {isManager && order.status === 'PENDING_REVIEW' && showRejectForm && (
        <div className="flex items-center gap-2">
          <input
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
            className="h-8 px-2 text-sm border border-slate-200 rounded w-48"
          />
          <Button variant="outline" size="sm" onClick={rejectOrder} disabled={loading === 'reject'}
            className="text-red-600 border-red-200 hover:bg-red-50 h-8">
            {loading === 'reject' ? '...' : 'Confirm Reject'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowRejectForm(false)} className="h-8">
            Cancel
          </Button>
        </div>
      )}

      {/* APPROVED → Send to Warehouse */}
      {isCoordinator && order.status === 'APPROVED' && (
        <Button size="sm" onClick={sendToWarehouse} disabled={loading === 'send'}
          style={{ background: '#1a2744', color: 'white' }}>
          <Building2 className="h-4 w-4 mr-1" />
          {loading === 'send' ? 'Sending...' : 'Send to Warehouse'}
        </Button>
      )}

      {/* SENT_TO_WAREHOUSE → Warehouse Confirm (warehouse staff or STC) */}
      {(isWarehouse || isCoordinator) && order.status === 'SENT_TO_WAREHOUSE' && (
        <Button size="sm" onClick={warehouseConfirm} disabled={loading === 'whconfirm'}
          className="bg-purple-600 hover:bg-purple-700 text-white">
          <CheckCircle className="h-4 w-4 mr-1" />
          {loading === 'whconfirm' ? 'Confirming...' : 'Confirm Receipt'}
        </Button>
      )}

      {/* WAREHOUSE_CONFIRMED / ALLOCATED / PARTIAL → Mark Ready */}
      {isCoordinator && ['WAREHOUSE_CONFIRMED', 'ALLOCATED', 'PARTIAL'].includes(order.status) && (
        <Button size="sm" onClick={markReady} disabled={loading === 'ready'}
          style={{ background: '#1a2744', color: 'white' }}>
          <CheckCircle className="h-4 w-4 mr-1" />
          {loading === 'ready' ? 'Processing...' : 'Mark Ready'}
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

      {/* Cancel — STC staff, non-terminal orders */}
      {isCoordinator && !['COMPLETE', 'CANCELLED'].includes(order.status) && (
        <Button variant="outline" size="sm" onClick={cancelOrder} disabled={loading === 'cancel'}
          className="text-red-600 border-red-200 hover:bg-red-50">
          <XCircle className="h-4 w-4 mr-1" />
          {loading === 'cancel' ? 'Cancelling...' : 'Cancel'}
        </Button>
      )}
    </div>
  )
}
