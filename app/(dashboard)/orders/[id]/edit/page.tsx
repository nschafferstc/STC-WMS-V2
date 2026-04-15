'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface SKU { id: number; code: string; description: string }
interface Line { id?: number; sku_id: number; sku_code: string; sku_description: string; ordered_qty: number }

export default function EditOrderPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [skus, setSkus] = useState<SKU[]>([])
  const [lines, setLines] = useState<Line[]>([])
  const [notes, setNotes] = useState('')
  const [loadType, setLoadType] = useState('PALLETIZED')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/orders/${params.id}`).then(r => r.json()).then(o => {
      setOrder(o)
      setNotes(o.notes ?? '')
      setLoadType(o.load_type)
      setLines(o.lines.map((l: any) => ({
        id: l.id,
        sku_id: l.sku_id,
        sku_code: l.sku.code,
        sku_description: l.sku.description,
        ordered_qty: l.ordered_qty,
      })))
      // Fetch SKUs for this client
      fetch(`/api/skus?client_id=${o.client_id}`).then(r => r.json()).then(setSkus)
    })
  }, [params.id])

  const addLine = () => {
    if (skus.length === 0) return
    const sku = skus[0]
    setLines(prev => [...prev, { sku_id: sku.id, sku_code: sku.code, sku_description: sku.description, ordered_qty: 1 }])
  }

  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx))

  const updateLineQty = (idx: number, qty: number) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, ordered_qty: qty } : l))
  }

  const updateLineSKU = (idx: number, skuId: number) => {
    const sku = skus.find(s => s.id === skuId)
    if (!sku) return
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, sku_id: sku.id, sku_code: sku.code, sku_description: sku.description } : l))
  }

  const save = async () => {
    setError('')
    if (lines.some(l => l.ordered_qty < 1)) { setError('All quantities must be at least 1'); return }
    setSaving(true)

    // Update order meta
    const metaRes = await fetch(`/api/orders/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, load_type: loadType }),
    })
    if (!metaRes.ok) { setError('Failed to save order'); setSaving(false); return }

    // Update lines via dedicated endpoint
    const linesRes = await fetch(`/api/orders/${params.id}/lines`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines }),
    })

    if (!linesRes.ok) { setError('Failed to save order lines'); setSaving(false); return }

    router.push(`/orders/${params.id}`)
  }

  if (!order) return <div className="p-8 text-slate-500">Loading...</div>

  const canEdit = !['COMPLETE', 'CANCELLED', 'READY'].includes(order.status)

  return (
    <div>
      <Link href={`/orders/${params.id}`} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Order
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Edit {order.code}</h1>
        {!canEdit && (
          <span className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
            Order is {order.status} — limited editing
          </span>
        )}
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: meta fields */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">Order Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Load Type</label>
                <select
                  value={loadType}
                  onChange={e => setLoadType(e.target.value)}
                  className="w-full h-9 rounded border border-slate-200 px-2 text-sm bg-white"
                >
                  <option value="PALLETIZED">Palletized</option>
                  <option value="FLOOR_LOADED">Floor Loaded</option>
                  <option value="MIXED">Mixed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Internal notes..."
                />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-5 text-sm space-y-2">
            <div className="flex justify-between"><span className="text-slate-500">Client</span><span className="font-medium">{order.client.name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Warehouse</span><span>{order.warehouse.stc_reference_name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="font-medium">{order.status}</span></div>
          </div>
        </div>

        {/* Right: order lines */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="text-sm font-semibold">Order Lines</h3>
              {canEdit && (
                <Button size="sm" variant="outline" onClick={addLine}>
                  <Plus className="h-4 w-4 mr-1" />Add Line
                </Button>
              )}
            </div>
            <div className="divide-y">
              {lines.map((line, idx) => (
                <div key={idx} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1">
                    {canEdit ? (
                      <select
                        value={line.sku_id}
                        onChange={e => updateLineSKU(idx, parseInt(e.target.value))}
                        className="w-full h-9 rounded border border-slate-200 px-2 text-sm bg-white"
                      >
                        {skus.map(s => (
                          <option key={s.id} value={s.id}>{s.code} — {s.description}</option>
                        ))}
                      </select>
                    ) : (
                      <div>
                        <div className="font-mono text-xs font-medium">{line.sku_code}</div>
                        <div className="text-xs text-slate-500">{line.sku_description}</div>
                      </div>
                    )}
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      min={1}
                      value={line.ordered_qty}
                      onChange={e => updateLineQty(idx, parseInt(e.target.value) || 1)}
                      disabled={!canEdit}
                      className="w-full h-9 rounded border border-slate-200 px-2 text-sm text-right"
                    />
                  </div>
                  {canEdit && (
                    <button onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {lines.length === 0 && (
                <div className="px-5 py-8 text-center text-slate-400 text-sm">No lines — click Add Line</div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => router.push(`/orders/${params.id}`)}>Cancel</Button>
            <Button onClick={save} disabled={saving} style={{ background: '#1a2744', color: 'white' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
