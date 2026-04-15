'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface SKU { id: number; code: string; description: string }
interface Line { id?: number; sku_id: number; sku_code: string; sku_description: string; expected_qty: number }

export default function EditASNPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [asn, setAsn] = useState<any>(null)
  const [skus, setSkus] = useState<SKU[]>([])
  const [lines, setLines] = useState<Line[]>([])
  const [notes, setNotes] = useState('')
  const [carrier, setCarrier] = useState('')
  const [proNumber, setProNumber] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/asns/${params.id}`).then(r => r.json()).then(a => {
      setAsn(a)
      setNotes(a.notes ?? '')
      setCarrier(a.carrier ?? '')
      setProNumber(a.pro_number ?? '')
      setExpectedDate(a.expected_date ? a.expected_date.slice(0, 10) : '')
      setLines(a.lines.map((l: any) => ({
        id: l.id,
        sku_id: l.sku_id,
        sku_code: l.sku.code,
        sku_description: l.sku.description,
        expected_qty: l.expected_qty,
      })))
      fetch(`/api/skus?client_id=${a.client_id}`).then(r => r.json()).then(setSkus)
    })
  }, [params.id])

  const addLine = () => {
    if (skus.length === 0) return
    const sku = skus[0]
    setLines(prev => [...prev, { sku_id: sku.id, sku_code: sku.code, sku_description: sku.description, expected_qty: 1 }])
  }

  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx))

  const updateLineQty = (idx: number, qty: number) =>
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, expected_qty: qty } : l))

  const updateLineSKU = (idx: number, skuId: number) => {
    const sku = skus.find(s => s.id === skuId)
    if (!sku) return
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, sku_id: sku.id, sku_code: sku.code, sku_description: sku.description } : l))
  }

  const save = async () => {
    setError('')
    if (lines.some(l => l.expected_qty < 1)) { setError('All quantities must be at least 1'); return }
    setSaving(true)

    const res = await fetch(`/api/asns/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes,
        carrier,
        pro_number: proNumber,
        expected_date: expectedDate || null,
        lines,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to save')
      setSaving(false)
      return
    }

    router.push(`/receiving/${params.id}`)
  }

  if (!asn) return <div className="p-8 text-slate-500">Loading...</div>

  const canEdit = !['RECEIVED', 'CANCELLED'].includes(asn.status)

  return (
    <div>
      <Link href={`/receiving/${params.id}`} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to ASN
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Edit {asn.code}</h1>
        {!canEdit && (
          <span className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
            ASN is {asn.status} — read only
          </span>
        )}
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">Shipment Info</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Expected Arrival Date</label>
                <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)}
                  disabled={!canEdit}
                  className="w-full h-9 rounded border border-slate-200 px-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Carrier</label>
                <input type="text" value={carrier} onChange={e => setCarrier(e.target.value)}
                  disabled={!canEdit}
                  placeholder="e.g. FedEx, UPS, XPO"
                  className="w-full h-9 rounded border border-slate-200 px-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">PRO / Tracking #</label>
                <input type="text" value={proNumber} onChange={e => setProNumber(e.target.value)}
                  disabled={!canEdit}
                  className="w-full h-9 rounded border border-slate-200 px-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  disabled={!canEdit} rows={3}
                  className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-5 text-sm space-y-2">
            <div className="flex justify-between"><span className="text-slate-500">Client</span><span className="font-medium">{asn.client.name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Warehouse</span><span>{asn.warehouse.stc_reference_name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="font-medium">{asn.status}</span></div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="text-sm font-semibold">Expected Lines</h3>
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
                      <select value={line.sku_id} onChange={e => updateLineSKU(idx, parseInt(e.target.value))}
                        className="w-full h-9 rounded border border-slate-200 px-2 text-sm bg-white">
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
                    <input type="number" min={1} value={line.expected_qty}
                      onChange={e => updateLineQty(idx, parseInt(e.target.value) || 1)}
                      disabled={!canEdit}
                      className="w-full h-9 rounded border border-slate-200 px-2 text-sm text-right" />
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
            <Button variant="outline" onClick={() => router.push(`/receiving/${params.id}`)}>Cancel</Button>
            {canEdit && (
              <Button onClick={save} disabled={saving} style={{ background: '#1a2744', color: 'white' }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
