'use client'
import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { padZip } from '@/lib/utils'

interface Store {
  id: number
  storeNum: string
  zip: string
  airportCode: string
  city: string
  state: string
  warehouse: string
  project: string
}

export function AirportCodeLookup({ stores }: { stores: Store[] }) {
  const [search, setSearch] = useState('')
  const [overrides, setOverrides] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState<number | null>(null)
  const [saved, setSaved] = useState<number | null>(null)

  const filtered = stores.filter(s =>
    !search ||
    s.zip.includes(search) ||
    s.storeNum.includes(search) ||
    s.city.toLowerCase().includes(search.toLowerCase()) ||
    s.airportCode.toLowerCase().includes(search.toLowerCase())
  )

  const saveOverride = async (store: Store) => {
    const newCode = overrides[store.id]
    if (!newCode) return
    setSaving(store.id)
    await fetch(`/api/admin/stores/${store.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ airport_code: newCode.toUpperCase() }),
    })
    setSaving(null)
    setSaved(store.id)
    setTimeout(() => setSaved(null), 2000)
  }

  return (
    <div>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by ZIP, store #, city, or airport..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="text-xs text-slate-500 mb-3">{filtered.length} stores</div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Store #</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">City, State</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">ZIP (padded)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Airport Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Warehouse</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Override</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(store => (
              <tr key={store.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2 font-medium">{store.storeNum}</td>
                <td className="px-4 py-2 text-slate-600">{store.city}, {store.state}</td>
                <td className="px-4 py-2 font-mono text-xs">{padZip(store.zip)}</td>
                <td className="px-4 py-2 font-mono font-bold text-blue-700">{store.airportCode}</td>
                <td className="px-4 py-2 text-xs text-slate-500">{store.warehouse}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2 items-center">
                    <Input
                      value={overrides[store.id] ?? ''}
                      onChange={e => setOverrides(prev => ({ ...prev, [store.id]: e.target.value }))}
                      placeholder={store.airportCode}
                      className="w-20 font-mono text-xs uppercase"
                      maxLength={3}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => saveOverride(store)}
                      disabled={!overrides[store.id] || saving === store.id}
                    >
                      {saving === store.id ? '...' : saved === store.id ? '✓' : 'Set'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No stores found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
