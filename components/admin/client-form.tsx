'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ClientFormProps {
  mode: 'create' | 'edit'
  clientId?: number
  defaultValues?: { code: string; name: string }
}

export function ClientForm({ mode, clientId, defaultValues }: ClientFormProps) {
  const router = useRouter()
  const [code, setCode] = useState(defaultValues?.code ?? '')
  const [name, setName] = useState(defaultValues?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const url = mode === 'create' ? '/api/admin/clients' : `/api/admin/clients/${clientId}`
      const method = mode === 'create' ? 'POST' : 'PATCH'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase(), name }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to save client')
        setSaving(false)
        return
      }

      router.push('/admin/clients')
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 max-w-lg space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-2 text-sm">{error}</div>
      )}

      <div>
        <Label htmlFor="code">Client Code <span className="text-slate-400 font-normal">(uppercase, e.g. KR)</span></Label>
        <Input
          id="code"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          required
          className="mt-1 font-mono"
          placeholder="KR"
          maxLength={10}
          disabled={mode === 'edit'}
        />
        {mode === 'edit' && <p className="text-xs text-slate-400 mt-1">Code cannot be changed after creation</p>}
      </div>

      <div>
        <Label htmlFor="name">Client Name</Label>
        <Input id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1" placeholder="Kroger Co." />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving} style={{ background: '#1a2744', color: 'white' }}>
          {saving ? 'Saving...' : mode === 'create' ? 'Create Client' : 'Save Changes'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
