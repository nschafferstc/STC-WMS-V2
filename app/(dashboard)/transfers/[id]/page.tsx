'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Client wrapper — data fetched on client
export default function TransferDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [transfer, setTransfer] = React.useState<any>(null)
  const [loading, setLoading] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch(`/api/transfers/${params.id}`).then(r => r.json()).then(setTransfer)
  }, [params.id])

  const action = async (status: string) => {
    setLoading(status)
    await fetch(`/api/transfers/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const updated = await fetch(`/api/transfers/${params.id}`).then(r => r.json())
    setTransfer(updated)
    setLoading(null)
  }

  if (!transfer) return <div className="p-8 text-slate-500">Loading...</div>

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—'

  return (
    <div>
      <Link href="/transfers" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Transfers
      </Link>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 font-mono">{transfer.code}</h1>
            <StatusBadge status={transfer.status} />
          </div>
          <div className="text-sm text-slate-500">
            {transfer.from_warehouse?.stc_reference_name} → {transfer.to_warehouse?.stc_reference_name}
          </div>
        </div>
        <div className="flex gap-2">
          {transfer.status === 'PENDING' && (
            <Button onClick={() => action('CONFIRMED')} disabled={loading === 'CONFIRMED'} style={{ background: '#1a2744', color: 'white' }} size="sm">
              {loading === 'CONFIRMED' ? 'Confirming...' : 'Confirm Transfer'}
            </Button>
          )}
          {transfer.status === 'CONFIRMED' && (
            <Button onClick={() => action('IN_TRANSIT')} disabled={loading === 'IN_TRANSIT'} style={{ background: '#f4811f', color: 'white' }} size="sm">
              {loading === 'IN_TRANSIT' ? '...' : 'Mark In Transit'}
            </Button>
          )}
          {transfer.status === 'IN_TRANSIT' && (
            <Button onClick={() => action('RECEIVED')} disabled={loading === 'RECEIVED'} style={{ background: '#1a2744', color: 'white' }} size="sm">
              {loading === 'RECEIVED' ? 'Processing...' : 'Mark Received'}
            </Button>
          )}
          {!['RECEIVED', 'CANCELLED'].includes(transfer.status) && (
            <Button variant="outline" size="sm" onClick={() => action('CANCELLED')} className="text-red-600 border-red-200">
              Cancel
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Status</span><StatusBadge status={transfer.status} /></div>
              <div className="flex justify-between"><span className="text-slate-500">From</span><span className="font-medium">{transfer.from_warehouse.stc_reference_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">To</span><span className="font-medium">{transfer.to_warehouse.stc_reference_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Created</span><span>{formatDate(transfer.createdAt)}</span></div>
              {transfer.confirmed_at && <div className="flex justify-between"><span className="text-slate-500">Confirmed</span><span>{formatDate(transfer.confirmed_at)}</span></div>}
              {transfer.received_at && <div className="flex justify-between"><span className="text-slate-500">Received</span><span>{formatDate(transfer.received_at)}</span></div>}
            </div>
            {transfer.notes && <div className="mt-3 pt-3 border-t text-sm text-slate-600">{transfer.notes}</div>}
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold">Transfer Lines</h3></div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">SKU</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Requested</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Sent</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Received</th>
                </tr>
              </thead>
              <tbody>
                {transfer.lines.map((line: any) => (
                  <tr key={line.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3"><div className="font-mono text-xs text-slate-700">{line.sku.code}</div><div className="text-xs text-slate-500">{line.sku.description?.slice(0, 50)}</div></td>
                    <td className="px-4 py-3 text-right">{line.qty_requested}</td>
                    <td className="px-4 py-3 text-right">{line.qty_sent ?? '—'}</td>
                    <td className="px-4 py-3 text-right">{line.qty_received ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
