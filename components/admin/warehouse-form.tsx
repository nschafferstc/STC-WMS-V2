'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface WarehouseFormProps {
  warehouseId: number
  defaultValues: {
    code: string
    company_name: string
    stc_reference_name: string
    address: string
    city: string
    state: string
    zip: string
  }
}

export function WarehouseForm({ warehouseId, defaultValues }: WarehouseFormProps) {
  const router = useRouter()
  const [values, setValues] = useState(defaultValues)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/warehouses/${warehouseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to save warehouse')
        setSaving(false)
        return
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 max-w-lg space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-2 text-sm">{error}</div>
      )}

      <div>
        <Label htmlFor="code">Warehouse Code</Label>
        <Input id="code" value={values.code} onChange={set('code')} required className="mt-1 font-mono" placeholder="DC-OH-001" />
      </div>

      <div>
        <Label htmlFor="stc_reference_name">STC Reference Name <span className="text-slate-400 font-normal">(shown to users)</span></Label>
        <Input id="stc_reference_name" value={values.stc_reference_name} onChange={set('stc_reference_name')} required className="mt-1" placeholder="Ohio DC" />
      </div>

      <div>
        <Label htmlFor="company_name">3PL Partner / Company Name <span className="text-slate-400 font-normal">(admin only)</span></Label>
        <Input id="company_name" value={values.company_name} onChange={set('company_name')} required className="mt-1" placeholder="Acme Logistics LLC" />
      </div>

      <div>
        <Label htmlFor="address">Street Address</Label>
        <Input id="address" value={values.address} onChange={set('address')} required className="mt-1" placeholder="123 Warehouse Blvd" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <Label htmlFor="city">City</Label>
          <Input id="city" value={values.city} onChange={set('city')} required className="mt-1" placeholder="Columbus" />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input id="state" value={values.state} onChange={set('state')} required className="mt-1" placeholder="OH" maxLength={2} />
        </div>
        <div>
          <Label htmlFor="zip">ZIP</Label>
          <Input id="zip" value={values.zip} onChange={set('zip')} required className="mt-1 font-mono" placeholder="43215" maxLength={10} />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={saving} style={{ background: '#1a2744', color: 'white' }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
      </div>
    </form>
  )
}
