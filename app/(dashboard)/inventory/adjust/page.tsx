'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const REASONS = [
  'CYCLE_COUNT',
  'DAMAGE_WRITE_OFF',
  'RECEIVING_CORRECTION',
  'RETURN_TO_STOCK',
  'THEFT_SHRINKAGE',
  'EXPIRY_DISPOSAL',
  'SYSTEM_CORRECTION',
  'OTHER',
]

export default function InventoryAdjustPage() {
  const router = useRouter()
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [skus, setSkus] = useState<any[]>([])
  const [warehouseId, setWarehouseId] = useState('')
  const [skuId, setSkuId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('CYCLE_COUNT')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [recentAdjustments, setRecentAdjustments] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/warehouses').then(r => r.json()).then(setWarehouses)
    fetch('/api/skus').then(r => r.json()).then(setSkus)
    fetch('/api/inventory/adjust').then(r => r.json()).then(setRecentAdjustments)
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!warehouseId || !skuId || !quantity) { setError('Warehouse, SKU, and quantity are required'); return }
    const qty = parseInt(quantity)
    if (isNaN(qty) || qty === 0) { setError('Quantity cannot be zero'); return }
    setSaving(true)

    const res = await fetch('/api/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ warehouse_id: warehouseId, sku_id: skuId, quantity: qty, reason, notes }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed'); setSaving(false); return }

    setSuccess(`Adjustment applied: ${qty > 0 ? '+' : ''}${qty} units`)
    setQuantity('')
    setNotes('')
    // Refresh recent
    fetch('/api/inventory/adjust').then(r => r.json()).then(setRecentAdjustments)
    setSaving(false)
  }

  const selectedSku = skus.find(s => s.id === parseInt(skuId))

  return (
    <div>
      <Link href="/inventory" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Inventory
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Inventory Adjustment</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">New Adjustment</h2>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">{success}</div>}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Warehouse *</label>
              <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)}
                className="w-full h-9 rounded border border-slate-200 px-2 text-sm bg-white" required>
                <option value="">Select warehouse...</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.stc_reference_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">SKU *</label>
              <select value={skuId} onChange={e => setSkuId(e.target.value)}
                className="w-full h-9 rounded border border-slate-200 px-2 text-sm bg-white" required>
                <option value="">Select SKU...</option>
                {skus.map(s => <option key={s.id} value={s.id}>{s.code} — {s.description}</option>)}
              </select>
              {selectedSku && (
                <p className="mt-1 text-xs text-slate-500">Client: {selectedSku.client?.name}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Quantity * <span className="text-slate-400 font-normal">(use negative to remove stock)</span>
              </label>
              <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)}
                placeholder="e.g. 50 or -12"
                className="w-full h-9 rounded border border-slate-200 px-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Reason *</label>
              <select value={reason} onChange={e => setReason(e.target.value)}
                className="w-full h-9 rounded border border-slate-200 px-2 text-sm bg-white" required>
                {REASONS.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Optional additional detail..."
                className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
            </div>
            <Button type="submit" disabled={saving} style={{ background: '#1a2744', color: 'white' }} className="w-full">
              {saving ? 'Applying...' : 'Apply Adjustment'}
            </Button>
          </form>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="px-5 py-4 border-b font-semibold text-slate-900 text-sm">Recent Adjustments</div>
          <div className="divide-y">
            {recentAdjustments.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">No adjustments yet</div>
            ) : recentAdjustments.slice(0, 20).map((adj: any) => (
              <div key={adj.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-800">
                    <span className="font-mono">{adj.sku?.code}</span>
                    <span className={`ml-2 font-bold ${adj.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {adj.quantity > 0 ? '+' : ''}{adj.quantity}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{adj.reason.replace(/_/g, ' ')} · {adj.adjusted_by}</div>
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(adj.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
