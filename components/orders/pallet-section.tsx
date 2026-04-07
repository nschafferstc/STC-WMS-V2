'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Package } from 'lucide-react'

interface Pallet {
  id: number
  code: string
  length: any
  width: any
  height: any
  weight_lbs: any
  shrink_wrapped: boolean
  items: Array<{
    id: number
    sku: { code: string; description: string }
    qty: number
  }>
}

interface PalletSectionProps {
  orderId: number
  pallets: Pallet[]
  orderStatus: string
}

export function PalletSection({ orderId, pallets, orderStatus }: PalletSectionProps) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    length: '',
    width: '',
    height: '',
    weight_lbs: '',
    shrink_wrapped: false,
  })

  const canEdit = !['READY', 'COMPLETE', 'CANCELLED'].includes(orderStatus)

  const addPallet = async () => {
    setSaving(true)
    const res = await fetch(`/api/orders/${orderId}/pallets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        length: parseFloat(form.length) || null,
        width: parseFloat(form.width) || null,
        height: parseFloat(form.height) || null,
        weight_lbs: parseFloat(form.weight_lbs) || null,
      }),
    })
    if (res.ok) {
      setAdding(false)
      setForm({ length: '', width: '', height: '', weight_lbs: '', shrink_wrapped: false })
      router.refresh()
    } else {
      alert('Failed to add pallet')
    }
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h2 className="font-semibold text-slate-900">Pallets ({pallets.length})</h2>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1" />Add Pallet
          </Button>
        )}
      </div>

      {adding && (
        <div className="p-5 border-b bg-slate-50">
          <h3 className="font-medium text-sm mb-3">New Pallet</h3>
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div>
              <Label className="text-xs">Length (in)</Label>
              <Input
                value={form.length}
                onChange={e => setForm(p => ({ ...p, length: e.target.value }))}
                placeholder="L"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Width (in)</Label>
              <Input
                value={form.width}
                onChange={e => setForm(p => ({ ...p, width: e.target.value }))}
                placeholder="W"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Height (in)</Label>
              <Input
                value={form.height}
                onChange={e => setForm(p => ({ ...p, height: e.target.value }))}
                placeholder="H"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Weight (lbs)</Label>
              <Input
                value={form.weight_lbs}
                onChange={e => setForm(p => ({ ...p, weight_lbs: e.target.value }))}
                placeholder="lbs"
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id="shrink"
              checked={form.shrink_wrapped}
              onChange={e => setForm(p => ({ ...p, shrink_wrapped: e.target.checked }))}
            />
            <label htmlFor="shrink" className="text-sm">
              Shrink wrapped
            </label>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={addPallet}
              disabled={saving}
              style={{ background: '#1a2744', color: 'white' }}
            >
              {saving ? 'Adding...' : 'Add Pallet'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {pallets.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-400 text-sm">
            No pallets yet. Add pallets to begin pick/pack.
          </div>
        ) : (
          pallets.map(pallet => (
            <div key={pallet.id} className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold text-sm">{pallet.code}</span>
                  {pallet.shrink_wrapped && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Shrink Wrapped
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  {pallet.length && pallet.width && pallet.height
                    ? `${pallet.length}×${pallet.width}×${pallet.height}"`
                    : 'No dims'}
                  {pallet.weight_lbs ? ` · ${pallet.weight_lbs} lbs` : ''}
                </div>
              </div>
              <div className="ml-6 text-sm text-slate-600">
                {pallet.items.length === 0 ? (
                  <span className="text-slate-400 italic">No items assigned</span>
                ) : (
                  pallet.items.map(item => (
                    <div key={item.id} className="flex justify-between py-0.5">
                      <span>
                        {item.sku.code} — {item.sku.description}
                      </span>
                      <span className="font-medium">{item.qty} units</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
