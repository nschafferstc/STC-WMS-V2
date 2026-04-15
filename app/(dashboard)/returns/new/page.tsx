'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'

export default function NewReturnPage() {
  const router = useRouter()
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [skus, setSkus] = useState<any[]>([])
  const [warehouseId, setWarehouseId] = useState('')
  const [clientId, setClientId] = useState('')
  const [returnType, setReturnType] = useState('JOB_SITE')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState([{ sku_id: '', qty: '', condition: 'GOOD', notes: '' }])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/warehouses').then(r => r.json()).then(setWarehouses)
    fetch('/api/clients').then(r => r.json()).then(setClients)
    fetch('/api/skus').then(r => r.json()).then(setSkus)
  }, [])

  const addLine = () => setLines([...lines, { sku_id: '', qty: '', condition: 'GOOD', notes: '' }])
  const updateLine = (i: number, field: string, value: string) => {
    const updated = [...lines]
    updated[i] = { ...updated[i], [field]: value }
    setLines(updated)
  }

  const submit = async () => {
    setLoading(true)
    const res = await fetch('/api/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ warehouse_id: warehouseId, client_id: clientId, return_type: returnType, notes, lines }),
    })
    if (res.ok) router.push('/returns')
    setLoading(false)
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Log Return" description="Record inbound return from job site, customer, or vendor" />
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Warehouse</label>
            <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
              <option value="">Select...</option>
              {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.stc_reference_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
              <option value="">Select...</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Return Type</label>
          <select value={returnType} onChange={e => setReturnType(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
            <option value="JOB_SITE">Job Site Return</option>
            <option value="CUSTOMER">Customer Return</option>
            <option value="VENDOR">Vendor Return</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700">Items</label>
            <button onClick={addLine} className="text-xs text-blue-600 hover:underline">+ Add Item</button>
          </div>
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 mb-2">
              <select value={line.sku_id} onChange={e => updateLine(i, 'sku_id', e.target.value)} className="border border-slate-300 rounded-md px-2 py-2 text-sm">
                <option value="">SKU...</option>
                {skus.map((s: any) => <option key={s.id} value={s.id}>{s.code}</option>)}
              </select>
              <input type="number" placeholder="Qty" value={line.qty} onChange={e => updateLine(i, 'qty', e.target.value)} className="border border-slate-300 rounded-md px-2 py-2 text-sm" />
              <select value={line.condition} onChange={e => updateLine(i, 'condition', e.target.value)} className="border border-slate-300 rounded-md px-2 py-2 text-sm">
                <option value="GOOD">Good</option>
                <option value="DAMAGED">Damaged</option>
                <option value="QUARANTINE">Quarantine</option>
              </select>
            </div>
          ))}
        </div>
        <Button onClick={submit} disabled={loading} style={{ background: '#1a2744', color: 'white' }}>
          {loading ? 'Saving...' : 'Log Return'}
        </Button>
      </div>
    </div>
  )
}
