'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const DISCREPANCY_TYPES = [
  'BOX_CRUSHED',
  'WATER_DAMAGE',
  'PACKAGING_DAMAGE',
  'MISSING_ITEM',
  'OVERAGE',
  'WRONG_ITEM',
  'OTHER',
]

interface ReceiptLine {
  sku_id: number
  sku_code: string
  expected_qty: number
  received_qty: number
  discrepancy_type: string
  notes: string
}

interface ReceiptFormProps {
  asnId: number
  lines: Array<{
    sku_id: number
    sku: { code: string; description: string }
    expected_qty: number
  }>
}

export function ReceiptForm({ asnId, lines }: ReceiptFormProps) {
  const router = useRouter()
  const [receiptLines, setReceiptLines] = useState<ReceiptLine[]>(
    lines.map(l => ({
      sku_id: l.sku_id,
      sku_code: l.sku.code,
      expected_qty: l.expected_qty,
      received_qty: l.expected_qty,
      discrepancy_type: '',
      notes: '',
    }))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (i: number, field: keyof ReceiptLine, value: string | number) => {
    setReceiptLines(prev =>
      prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l))
    )
  }

  const submit = async () => {
    // Validate: if there's a discrepancy, a type is required
    const missingType = receiptLines.some(
      l => l.received_qty !== l.expected_qty && !l.discrepancy_type
    )
    if (missingType) {
      setError('Please select a discrepancy type for all lines with quantity differences.')
      return
    }

    setSaving(true)
    setError(null)
    const res = await fetch(`/api/asns/${asnId}/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines: receiptLines }),
    })
    if (res.ok) {
      router.refresh()
    } else {
      const err = await res.json()
      setError(err.error ?? 'Failed to record receipt')
    }
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 mt-6">
      <div className="px-5 py-4 border-b font-semibold text-slate-900">Record Receipt</div>
      {error && (
        <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">SKU</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Expected</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Received</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                Discrepancy Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Notes</th>
            </tr>
          </thead>
          <tbody>
            {receiptLines.map((line, i) => {
              const hasDiscrepancy = line.received_qty !== line.expected_qty
              return (
                <tr
                  key={i}
                  className={`border-b border-slate-50 last:border-0 ${hasDiscrepancy ? 'bg-red-50' : ''}`}
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium">{line.sku_code}</td>
                  <td className="px-4 py-3 text-right font-medium">{line.expected_qty}</td>
                  <td className="px-4 py-3 text-right">
                    <Input
                      type="number"
                      min={0}
                      value={line.received_qty}
                      onChange={e => update(i, 'received_qty', parseInt(e.target.value) || 0)}
                      className={`w-20 text-right ${hasDiscrepancy ? 'border-red-400' : ''}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={line.discrepancy_type}
                      onChange={e => update(i, 'discrepancy_type', e.target.value)}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">— None —</option>
                      {DISCREPANCY_TYPES.map(t => (
                        <option key={t} value={t}>
                          {t.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      value={line.notes}
                      onChange={e => update(i, 'notes', e.target.value)}
                      placeholder="Optional notes"
                      className="min-w-[150px]"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-4 flex justify-end">
        <Button
          onClick={submit}
          disabled={saving}
          style={{ background: '#1a2744', color: 'white' }}
        >
          {saving ? 'Saving...' : 'Confirm Receipt'}
        </Button>
      </div>
    </div>
  )
}
