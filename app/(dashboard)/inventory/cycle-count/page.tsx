'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import Link from 'next/link'
import { ArrowLeft, Plus, ClipboardCheck } from 'lucide-react'

export default function CycleCountPage() {
  const router = useRouter()
  const [counts, setCounts] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [showNew, setShowNew] = useState(false)
  const [warehouseId, setWarehouseId] = useState('')
  const [notes, setNotes] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    fetch('/api/inventory/cycle-count').then(r => r.json()).then(setCounts)
  }

  useEffect(() => {
    load()
    fetch('/api/warehouses').then(r => r.json()).then(w => {
      setWarehouses(w)
      if (w.length === 1) setWarehouseId(String(w[0].id))
    })
  }, [])

  const createCount = async () => {
    if (!warehouseId) { setError('Select a warehouse'); return }
    setCreating(true)
    setError('')
    const res = await fetch('/api/inventory/cycle-count', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ warehouse_id: warehouseId, notes }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setCreating(false); return }
    router.push(`/inventory/cycle-count/${data.id}`)
  }

  return (
    <div>
      <Link href="/inventory" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Inventory
      </Link>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cycle Counts</h1>
          <p className="text-sm text-slate-500 mt-1">Physical inventory counts with variance tracking</p>
        </div>
        <Button onClick={() => setShowNew(true)} style={{ background: '#1a2744', color: 'white' }}>
          <Plus className="h-4 w-4 mr-1" />New Cycle Count
        </Button>
      </div>

      {showNew && (
        <div className="bg-white rounded-lg border p-5 mb-6">
          <h3 className="text-sm font-semibold mb-4">Start New Cycle Count</h3>
          {error && <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Warehouse *</label>
              <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)}
                className="w-full h-9 rounded border border-slate-200 px-2 text-sm bg-white">
                <option value="">Select...</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.stc_reference_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Monthly count — Zone A"
                className="w-full h-9 rounded border border-slate-200 px-2 text-sm" />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={createCount} disabled={creating} style={{ background: '#1a2744', color: 'white' }}>
                {creating ? 'Creating...' : 'Start Count'}
              </Button>
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            This will snapshot current system quantities for all SKUs in the selected warehouse.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Count #</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Warehouse</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">SKUs</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Counted By</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Started</th>
            </tr>
          </thead>
          <tbody>
            {counts.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                <ClipboardCheck className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                No cycle counts yet
              </td></tr>
            ) : counts.map((cc: any) => (
              <tr key={cc.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/inventory/cycle-count/${cc.id}`} className="font-mono text-xs text-blue-600 hover:underline font-medium">
                    {cc.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{cc.warehouse?.stc_reference_name}</td>
                <td className="px-4 py-3">{cc._count?.lines ?? 0}</td>
                <td className="px-4 py-3 text-slate-600">{cc.counted_by}</td>
                <td className="px-4 py-3"><StatusBadge status={cc.status} /></td>
                <td className="px-4 py-3 text-xs text-slate-500">{new Date(cc.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
