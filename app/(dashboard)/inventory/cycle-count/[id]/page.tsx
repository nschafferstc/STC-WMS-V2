'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function CycleCountDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [cc, setCc] = useState<any>(null)
  const [counts, setCounts] = useState<Record<number, string>>({})
  const [lineNotes, setLineNotes] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/inventory/cycle-count/${params.id}`).then(r => r.json()).then(data => {
      setCc(data)
      const initial: Record<number, string> = {}
      const initialNotes: Record<number, string> = {}
      for (const line of data.lines) {
        initial[line.id] = line.counted_qty !== null && line.counted_qty !== undefined ? String(line.counted_qty) : ''
        initialNotes[line.id] = line.notes ?? ''
      }
      setCounts(initial)
      setLineNotes(initialNotes)
    })
  }, [params.id])

  const buildLines = () =>
    cc.lines.map((line: any) => ({
      id: line.id,
      counted_qty: counts[line.id] !== '' && counts[line.id] !== undefined ? parseInt(counts[line.id]) : null,
      notes: lineNotes[line.id] || null,
    }))

  const save = async () => {
    setSaving(true)
    await fetch(`/api/inventory/cycle-count/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines: buildLines() }),
    })
    setSaving(false)
  }

  const complete = async () => {
    if (!confirm('Complete this cycle count? Variances will be applied to inventory automatically.')) return
    setCompleting(true)
    const res = await fetch(`/api/inventory/cycle-count/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines: buildLines(), complete: true }),
    })
    if (res.ok) {
      router.push('/inventory/cycle-count')
    } else {
      const d = await res.json()
      setError(d.error)
      setCompleting(false)
    }
  }

  if (!cc) return <div className="p-8 text-slate-500">Loading...</div>

  const lines = cc.lines ?? []
  const counted = lines.filter((l: any) => counts[l.id] !== '' && counts[l.id] !== undefined).length
  const variances = lines.filter((l: any) => {
    const c = counts[l.id]
    return c !== '' && c !== undefined && parseInt(c) !== l.system_qty
  }).length

  return (
    <div>
      <Link href="/inventory/cycle-count" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Cycle Counts
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 font-mono">{cc.code}</h1>
            <StatusBadge status={cc.status} />
          </div>
          <div className="text-sm text-slate-500">{cc.warehouse?.stc_reference_name} · Started by {cc.counted_by}</div>
        </div>
        {cc.status === 'IN_PROGRESS' && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Progress'}</Button>
            <Button onClick={complete} disabled={completing || counted === 0} style={{ background: '#1a2744', color: 'white' }}>
              <CheckCircle className="h-4 w-4 mr-1" />{completing ? 'Completing...' : 'Complete Count'}
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-xs text-slate-500 uppercase font-medium">Total SKUs</div>
          <div className="text-3xl font-bold mt-1">{lines.length}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-xs text-slate-500 uppercase font-medium">Counted</div>
          <div className="text-3xl font-bold mt-1 text-blue-700">{counted}</div>
        </div>
        <div className="bg-white rounded-lg border p-4 border-l-4 border-l-orange-400">
          <div className="text-xs text-slate-500 uppercase font-medium">Variances</div>
          <div className={`text-3xl font-bold mt-1 ${variances > 0 ? 'text-orange-600' : 'text-green-700'}`}>{variances}</div>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

      {cc.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4 text-sm text-amber-800">
          <span className="font-semibold">Notes: </span>{cc.notes}
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">SKU</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">System Qty</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Counted Qty</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Variance</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Notes</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line: any) => {
              const countedVal = counts[line.id]
              const countedNum = countedVal !== '' && countedVal !== undefined ? parseInt(countedVal) : null
              const variance = countedNum !== null ? countedNum - line.system_qty : null
              const hasVariance = variance !== null && variance !== 0
              return (
                <tr key={line.id} className={`border-b border-slate-50 last:border-0 ${hasVariance ? 'bg-orange-50/30' : ''}`}>
                  <td className="px-4 py-2">
                    <div className="font-mono text-xs font-medium">{line.sku?.code}</div>
                    <div className="text-xs text-slate-500">{line.sku?.description?.slice(0, 50)}</div>
                  </td>
                  <td className="px-4 py-2 text-right font-medium">{line.system_qty}</td>
                  <td className="px-4 py-2 text-center">
                    {cc.status === 'IN_PROGRESS' ? (
                      <input
                        type="number"
                        min={0}
                        value={counts[line.id] ?? ''}
                        onChange={e => setCounts(prev => ({ ...prev, [line.id]: e.target.value }))}
                        className="w-20 h-8 rounded border border-slate-200 px-2 text-sm text-right"
                        placeholder="—"
                      />
                    ) : (
                      <span>{line.counted_qty ?? '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {variance !== null ? (
                      <span className={`font-bold ${variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {variance > 0 ? '+' : ''}{variance}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-2">
                    {cc.status === 'IN_PROGRESS' ? (
                      <input
                        type="text"
                        value={lineNotes[line.id] ?? ''}
                        onChange={e => setLineNotes(prev => ({ ...prev, [line.id]: e.target.value }))}
                        className="w-full h-8 rounded border border-slate-200 px-2 text-xs"
                        placeholder="Optional note..."
                      />
                    ) : (
                      <span className="text-xs text-slate-500">{line.notes ?? '—'}</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {cc.status === 'IN_PROGRESS' && (
          <div className="px-4 py-3 bg-slate-50 border-t flex justify-between items-center">
            <span className="text-xs text-slate-500">{counted} of {lines.length} SKUs counted</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Progress'}</Button>
              <Button size="sm" onClick={complete} disabled={completing || counted === 0} style={{ background: '#1a2744', color: 'white' }}>
                Complete Count
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
