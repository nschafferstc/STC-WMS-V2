'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewShipmentPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [orderId, setOrderId] = useState('')
  const [carrier, setCarrier] = useState('')
  const [proNumber, setProNumber] = useState('')
  const [tracking, setTracking] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Only show READY orders
    fetch('/api/orders?status=READY').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setOrders(data)
    })
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!orderId) { setError('Select an order'); return }
    setSaving(true)

    const res = await fetch('/api/shipments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, carrier, pro_number: proNumber, tracking, notes }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed'); setSaving(false); return }

    router.push(`/shipments/${data.id}`)
  }

  const selectedOrder = orders.find(o => o.id === parseInt(orderId))

  return (
    <div>
      <Link href="/shipments" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Shipments
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Create Shipment</h1>

      <div className="max-w-2xl">
        <div className="bg-white rounded-lg border p-6">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Order * <span className="font-normal text-slate-400">(READY orders only)</span></label>
              <select value={orderId} onChange={e => setOrderId(e.target.value)}
                className="w-full h-9 rounded border border-slate-200 px-2 text-sm bg-white" required>
                <option value="">Select order...</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>{o.code} — {o.client?.name} · {o.store ? `Store #${o.store.store_num}` : o.warehouse?.stc_reference_name}</option>
                ))}
              </select>
              {orders.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">No READY orders found. Mark an order as Ready before creating a shipment.</p>
              )}
            </div>

            {selectedOrder && (
              <div className="bg-slate-50 rounded p-3 text-sm">
                <div className="font-medium text-slate-800 mb-1">{selectedOrder.code}</div>
                <div className="text-slate-500 text-xs">
                  {selectedOrder.client?.name} · {selectedOrder._count?.lines ?? 0} lines · {selectedOrder.load_type?.replace(/_/g, ' ')}
                  {selectedOrder.store && ` · Store #${selectedOrder.store?.store_num}`}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Carrier</label>
              <select value={carrier} onChange={e => setCarrier(e.target.value)}
                className="w-full h-9 rounded border border-slate-200 px-2 text-sm bg-white">
                <option value="">Select carrier...</option>
                {['FedEx', 'UPS', 'XPO Logistics', 'Old Dominion', 'R+L Carriers', 'Estes Express', 'ABF Freight', 'Saia', 'Southeastern Freight', 'Other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">PRO Number</label>
                <input type="text" value={proNumber} onChange={e => setProNumber(e.target.value)}
                  className="w-full h-9 rounded border border-slate-200 px-2 text-sm" placeholder="PRO / Bill of Lading #" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tracking Number</label>
                <input type="text" value={tracking} onChange={e => setTracking(e.target.value)}
                  className="w-full h-9 rounded border border-slate-200 px-2 text-sm" placeholder="Tracking #" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm" placeholder="Optional notes..." />
            </div>

            <div className="pt-2 flex gap-3">
              <Button type="submit" disabled={saving || orders.length === 0} style={{ background: '#1a2744', color: 'white' }}>
                {saving ? 'Creating...' : 'Create Shipment'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/shipments')}>Cancel</Button>
            </div>
          </form>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Creating a shipment will mark the order as <strong>COMPLETE</strong> and update inventory quantities automatically.
        </p>
      </div>
    </div>
  )
}
