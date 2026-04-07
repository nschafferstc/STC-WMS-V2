'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Upload, Plus, X } from 'lucide-react'

interface SKU {
  id: number
  code: string
  name: string
  description: string
  clientId: number
  clientName: string
  dims_l: string
  dims_w: string
  dims_h: string
  weight_lbs: string
  units_per_pallet: string
  low_stock_threshold: string
}

interface Client { id: number; name: string; code: string }

interface Props { skus: SKU[]; clients: Client[] }

export function SKUManagement({ skus, clients }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [showNewSKU, setShowNewSKU] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<string | null>(null)

  // New SKU form state
  const [newSKU, setNewSKU] = useState({
    code: '', name: '', description: '', client_id: '', dims_l: '', dims_w: '', dims_h: '',
    weight_lbs: '', units_per_pallet: '', low_stock_threshold: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const filtered = skus.filter(s => {
    const matchesSearch = !search ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
    const matchesClient = !clientFilter || s.clientId.toString() === clientFilter
    return matchesSearch && matchesClient
  })

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/admin/skus/bulk-upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setUploadResult(`Success: ${data.created} created, ${data.updated} updated, ${data.skipped} skipped`)
        router.refresh()
      } else {
        setUploadResult(`Error: ${data.error}`)
      }
    } catch {
      setUploadResult('Upload failed — check file format')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleCreateSKU = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)

    try {
      const res = await fetch('/api/admin/skus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSKU,
          client_id: parseInt(newSKU.client_id),
          dims_l: newSKU.dims_l ? parseFloat(newSKU.dims_l) : null,
          dims_w: newSKU.dims_w ? parseFloat(newSKU.dims_w) : null,
          dims_h: newSKU.dims_h ? parseFloat(newSKU.dims_h) : null,
          weight_lbs: newSKU.weight_lbs ? parseFloat(newSKU.weight_lbs) : null,
          units_per_pallet: newSKU.units_per_pallet ? parseInt(newSKU.units_per_pallet) : null,
          low_stock_threshold: newSKU.low_stock_threshold ? parseInt(newSKU.low_stock_threshold) : null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setSaveError(d.error ?? 'Failed to create SKU')
      } else {
        setShowNewSKU(false)
        setNewSKU({ code: '', name: '', description: '', client_id: '', dims_l: '', dims_w: '', dims_h: '', weight_lbs: '', units_per_pallet: '', low_stock_threshold: '' })
        router.refresh()
      }
    } catch {
      setSaveError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search SKU code, name, description..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleBulkUpload} className="hidden" />
        <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload className="h-4 w-4 mr-1" />{uploading ? 'Uploading...' : 'Bulk Upload'}
        </Button>
        <Button onClick={() => setShowNewSKU(true)} style={{ background: '#1a2744', color: 'white' }}>
          <Plus className="h-4 w-4 mr-1" />New SKU
        </Button>
      </div>

      {uploadResult && (
        <div className={`text-sm px-4 py-2 rounded border ${uploadResult.startsWith('Success') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {uploadResult}
        </div>
      )}

      {/* New SKU Form */}
      {showNewSKU && (
        <div className="bg-white rounded-lg border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">New SKU</h3>
            <button onClick={() => setShowNewSKU(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
          </div>
          {saveError && <div className="bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-sm mb-3">{saveError}</div>}
          <form onSubmit={handleCreateSKU} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-1">
              <Label>SKU Code *</Label>
              <Input value={newSKU.code} onChange={e => setNewSKU(p => ({ ...p, code: e.target.value }))} required className="mt-1 font-mono" placeholder="SKU-001" />
            </div>
            <div className="col-span-1">
              <Label>Name</Label>
              <Input value={newSKU.name} onChange={e => setNewSKU(p => ({ ...p, name: e.target.value }))} className="mt-1" placeholder="Widget A" />
            </div>
            <div className="col-span-2">
              <Label>Description *</Label>
              <Input value={newSKU.description} onChange={e => setNewSKU(p => ({ ...p, description: e.target.value }))} required className="mt-1" placeholder="Full description" />
            </div>
            <div>
              <Label>Client *</Label>
              <select
                value={newSKU.client_id}
                onChange={e => setNewSKU(p => ({ ...p, client_id: e.target.value }))}
                required
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">— Select —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <Label>L × W × H (in)</Label>
              <div className="flex gap-1 mt-1">
                <Input type="number" step="0.01" value={newSKU.dims_l} onChange={e => setNewSKU(p => ({ ...p, dims_l: e.target.value }))} placeholder="L" className="font-mono" />
                <Input type="number" step="0.01" value={newSKU.dims_w} onChange={e => setNewSKU(p => ({ ...p, dims_w: e.target.value }))} placeholder="W" className="font-mono" />
                <Input type="number" step="0.01" value={newSKU.dims_h} onChange={e => setNewSKU(p => ({ ...p, dims_h: e.target.value }))} placeholder="H" className="font-mono" />
              </div>
            </div>
            <div>
              <Label>Weight (lbs)</Label>
              <Input type="number" step="0.01" value={newSKU.weight_lbs} onChange={e => setNewSKU(p => ({ ...p, weight_lbs: e.target.value }))} className="mt-1 font-mono" placeholder="0.00" />
            </div>
            <div>
              <Label>Units/Pallet</Label>
              <Input type="number" value={newSKU.units_per_pallet} onChange={e => setNewSKU(p => ({ ...p, units_per_pallet: e.target.value }))} className="mt-1" placeholder="100" />
            </div>
            <div>
              <Label>Low Stock Alert</Label>
              <Input type="number" value={newSKU.low_stock_threshold} onChange={e => setNewSKU(p => ({ ...p, low_stock_threshold: e.target.value }))} className="mt-1" placeholder="50" />
            </div>
            <div className="col-span-2 md:col-span-4 flex gap-2 pt-1">
              <Button type="submit" disabled={saving} style={{ background: '#1a2744', color: 'white' }}>
                {saving ? 'Creating...' : 'Create SKU'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowNewSKU(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* SKU Table */}
      <div className="text-xs text-slate-500">{filtered.length} SKUs</div>
      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Client</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">L</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">W</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">H</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Wt (lbs)</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">U/Pallet</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Low Stock</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(sku => (
              <tr key={sku.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs font-medium text-slate-800">{sku.code}</td>
                <td className="px-4 py-2 text-slate-700 max-w-[180px] truncate">{sku.name || sku.description.slice(0, 40)}</td>
                <td className="px-4 py-2 text-xs text-slate-500">{sku.clientName}</td>
                <td className="px-4 py-2 font-mono text-xs text-slate-600">{sku.dims_l || '—'}</td>
                <td className="px-4 py-2 font-mono text-xs text-slate-600">{sku.dims_w || '—'}</td>
                <td className="px-4 py-2 font-mono text-xs text-slate-600">{sku.dims_h || '—'}</td>
                <td className="px-4 py-2 font-mono text-xs text-slate-600">{sku.weight_lbs || '—'}</td>
                <td className="px-4 py-2 text-right text-slate-600">{sku.units_per_pallet || '—'}</td>
                <td className="px-4 py-2 text-right text-slate-600">{sku.low_stock_threshold || '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">No SKUs found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
