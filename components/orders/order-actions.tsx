'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileText, CheckCircle } from 'lucide-react'

interface OrderActionsProps {
  order: { id: number; status: string; code: string }
}

export function OrderActions({ order }: OrderActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const markReady = async () => {
    if (
      !confirm(
        `Mark order ${order.code} as READY? This will generate the BOL and pack list.`
      )
    )
      return
    setLoading(true)
    const res = await fetch(`/api/orders/${order.id}/ready`, { method: 'POST' })
    if (res.ok) {
      router.refresh()
    } else {
      alert('Failed to update order status')
    }
    setLoading(false)
  }

  const downloadPackList = () => {
    window.open(`/api/orders/${order.id}/pack-list`, '_blank')
  }

  const downloadBOL = () => {
    window.open(`/api/orders/${order.id}/bol`, '_blank')
  }

  return (
    <div className="flex items-center gap-2">
      {['READY', 'COMPLETE'].includes(order.status) && (
        <>
          <Button variant="outline" size="sm" onClick={downloadPackList}>
            <FileText className="h-4 w-4 mr-1" />Pack List
          </Button>
          <Button variant="outline" size="sm" onClick={downloadBOL}>
            <FileText className="h-4 w-4 mr-1" />BOL
          </Button>
        </>
      )}
      {['ALLOCATED', 'PARTIAL'].includes(order.status) && (
        <Button
          size="sm"
          onClick={markReady}
          disabled={loading}
          style={{ background: '#1a2744', color: 'white' }}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          {loading ? 'Processing...' : 'Mark Ready'}
        </Button>
      )}
    </div>
  )
}
