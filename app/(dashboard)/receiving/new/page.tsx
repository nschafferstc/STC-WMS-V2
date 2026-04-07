'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

const asnSchema = z.object({
  client_id: z.string().min(1, 'Client required'),
  warehouse_id: z.string().min(1, 'Warehouse required'),
  expected_date: z.string().optional(),
  notes: z.string().optional(),
})

type ASNForm = z.infer<typeof asnSchema>

interface ASNLine {
  sku_id: string
  expected_qty: number
}

export default function NewASNPage() {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [skus, setSkus] = useState<any[]>([])
  const [lines, setLines] = useState<ASNLine[]>([{ sku_id: '', expected_qty: 1 }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ASNForm>({
    resolver: zodResolver(asnSchema),
  })

  const clientId = watch('client_id')

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(setClients)
    fetch('/api/warehouses').then(r => r.json()).then(setWarehouses)
  }, [])

  useEffect(() => {
    if (clientId) {
      fetch(`/api/skus?client_id=${clientId}`).then(r => r.json()).then(setSkus)
    } else {
      setSkus([])
    }
  }, [clientId])

  const addLine = () => setLines(prev => [...prev, { sku_id: '', expected_qty: 1 }])
  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i))
  const updateLine = (i: number, field: keyof ASNLine, value: string | number) => {
    setLines(prev => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)))
  }

  const onSubmit = async (data: ASNForm) => {
    if (lines.some(l => !l.sku_id || l.expected_qty < 1)) {
      setError('All lines must have a SKU and quantity greater than 0.')
      return
    }
    setSaving(true)
    setError(null)
    const res = await fetch('/api/asns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, lines }),
    })
    if (res.ok) {
      const asn = await res.json()
      router.push(`/receiving/${asn.id}`)
    } else {
      const err = await res.json()
      setError(err.error ?? 'Failed to create ASN')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <Link href="/receiving" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Receiving
      </Link>
      <PageHeader title="New ASN" description="Create an Advance Shipment Notice" />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">ASN Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Client</Label>
              <select
                {...register('client_id')}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.client_id && (
                <p className="text-red-500 text-xs mt-1">{errors.client_id.message}</p>
              )}
            </div>
            <div>
              <Label>Destination Warehouse</Label>
              <select
                {...register('warehouse_id')}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select warehouse...</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.stc_reference_name}</option>
                ))}
              </select>
              {errors.warehouse_id && (
                <p className="text-red-500 text-xs mt-1">{errors.warehouse_id.message}</p>
              )}
            </div>
            <div>
              <Label>Expected Arrival Date (optional)</Label>
              <Input
                type="date"
                {...register('expected_date')}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <textarea
              {...register('notes')}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              rows={2}
              placeholder="Carrier, PO numbers, special instructions..."
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Expected Lines</h2>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4 mr-1" />Add Line
            </Button>
          </div>
          {!clientId && (
            <p className="text-sm text-slate-400 italic mb-3">Select a client to load SKUs.</p>
          )}
          <div className="space-y-3">
            {lines.map((line, i) => (
              <div key={i} className="flex gap-3 items-center">
                <select
                  value={line.sku_id}
                  onChange={e => updateLine(i, 'sku_id', e.target.value)}
                  className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={!clientId}
                >
                  <option value="">Select SKU...</option>
                  {skus.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.description}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min={1}
                  value={line.expected_qty}
                  onChange={e => updateLine(i, 'expected_qty', parseInt(e.target.value) || 1)}
                  placeholder="Qty"
                  className="w-24"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLine(i)}
                  className="text-red-500 hover:text-red-700 flex-shrink-0"
                  disabled={lines.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/receiving">Cancel</Link>
          </Button>
          <Button type="submit" style={{ background: '#1a2744', color: 'white' }} disabled={saving}>
            {saving ? 'Creating...' : 'Create ASN'}
          </Button>
        </div>
      </form>
    </div>
  )
}
