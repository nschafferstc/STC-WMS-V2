'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'

export default function NewTransferPage() {
  const router = useRouter()
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [skus, setSkus] = useState<any[]>([])
  const [fromWarehouse, setFromWarehouse] = useState('')
  const [toWarehouse, setToWarehouse] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState([{ sku_id: '', qty_requested: '' }])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/warehouses').then(r => r.json()).then(setWarehouses)
    fetch('/api/skus').then(r => r.json()).then(setSkus)
  }, [])

  const addLine = () => setLines([...lines, { sku_id: '', qty_requested: '' }])
  const updateLine = (i: number, field: string, value: string) => {
    const updated = [...lines]
    updated[i] = { ...updated[i], [field]: value }
    setLines(updated)
  }

  const submit = async () => {
    setLoading(true)
    const res = await fetch('/api/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_warehouse_id: fromWarehouse, to_warehouse_id: toWarehouse, notes, lines }),
    })
    if (res.ok) router.push('/transfers')
    setLoading(false)
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="New Transfer Order" description="Move inventory between warehouses" />
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">From Warehouse</label>
            <select value={fromWarehouse} onChange={e => setFromWarehouse(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
              <option value="">Select...</option>
              {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.stc_reference_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">To Warehouse</label>
            <select value={toWarehouse} onChange={e => setToWarehouse(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
              <option value="">Select...</option>
              {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.stc_reference_name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700">SKU Lines</label>
            <button onClick={addLine} className="text-xs text-blue-600 hover:underline">+ Add Line</button>
          </div>
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 mb-2">
              <select value={line.sku_id} onChange={e => updateLine(i, 'sku_id', e.target.value)} className="border border-slate-300 rounded-md px-3 py-2 text-sm">
                <option value="">Select SKU...</option>
                {skus.map((s: any) => <option key={s.id} value={s.id}>{s.code} — {s.description?.slice(0, 40)}</option>)}
              </select>
              <input type="number" placeholder="Qty" value={line.qty_requested} onChange={e => updateLine(i, 'qty_requested', e.target.value)} className="border border-slate-300 rounded-md px-3 py-2 text-sm" />
            </div>
          ))}
        </div>
        <Button onClick={submit} disabled={loading} style={{ background: '#1a2744', color: 'white' }}>
          {loading ? 'Creating...' : 'Create Transfer Order'}
        </Button>
      </div>
    </div>
  )
}
