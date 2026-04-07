'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Client { id: number; name: string; code: string }

interface ProjectFormProps {
  mode: 'create' | 'edit'
  projectId?: number
  clients: Client[]
  defaultValues?: {
    code: string
    name: string
    client_id: number
    isRollout: boolean
    aging_threshold_days: number
    dim_factor_override: string | null
  }
}

export function ProjectForm({ mode, projectId, clients, defaultValues }: ProjectFormProps) {
  const router = useRouter()
  const [code, setCode] = useState(defaultValues?.code ?? '')
  const [name, setName] = useState(defaultValues?.name ?? '')
  const [clientId, setClientId] = useState<string>(defaultValues?.client_id?.toString() ?? '')
  const [isRollout, setIsRollout] = useState(defaultValues?.isRollout ?? false)
  const [agingDays, setAgingDays] = useState(defaultValues?.aging_threshold_days?.toString() ?? '90')
  const [dimOverride, setDimOverride] = useState(defaultValues?.dim_factor_override ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const body: Record<string, any> = {
      code: code.toUpperCase(),
      name,
      client_id: parseInt(clientId),
      isRollout,
      aging_threshold_days: parseInt(agingDays) || 90,
      dim_factor_override: dimOverride ? parseFloat(dimOverride) : null,
    }

    try {
      const url = mode === 'create' ? '/api/admin/projects' : `/api/admin/projects/${projectId}`
      const method = mode === 'create' ? 'POST' : 'PATCH'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to save project')
        setSaving(false)
        return
      }

      router.push('/admin/projects')
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
        <Label htmlFor="code">Project Code <span className="text-slate-400 font-normal">(uppercase, e.g. KR-2024-RESET)</span></Label>
        <Input
          id="code"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          required
          className="mt-1 font-mono"
          placeholder="KR-2024-RESET"
          disabled={mode === 'edit'}
        />
        {mode === 'edit' && <p className="text-xs text-slate-400 mt-1">Code cannot be changed after creation</p>}
      </div>

      <div>
        <Label htmlFor="name">Project Name</Label>
        <Input id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1" placeholder="Kroger 2024 Reset" />
      </div>

      <div>
        <Label htmlFor="client">Client</Label>
        <select
          id="client"
          value={clientId}
          onChange={e => setClientId(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          disabled={mode === 'edit'}
        >
          <option value="">— Select Client —</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isRollout"
          type="checkbox"
          checked={isRollout}
          onChange={e => setIsRollout(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300"
        />
        <Label htmlFor="isRollout" className="cursor-pointer">This is a rollout project (store-by-store deployment)</Label>
      </div>

      <div>
        <Label htmlFor="aging_days">Aging Threshold (days)</Label>
        <Input
          id="aging_days"
          type="number"
          value={agingDays}
          onChange={e => setAgingDays(e.target.value)}
          className="mt-1 w-32"
          placeholder="90"
          min={1}
          max={365}
        />
        <p className="text-xs text-slate-400 mt-1">Alert when inventory has been on-hand longer than this many days</p>
      </div>

      <div>
        <Label htmlFor="dim_override">Dim Factor Override <span className="text-slate-400 font-normal">(leave blank to use global)</span></Label>
        <Input
          id="dim_override"
          type="number"
          value={dimOverride}
          onChange={e => setDimOverride(e.target.value)}
          className="mt-1 w-32"
          placeholder="e.g. 166"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving} style={{ background: '#1a2744', color: 'white' }}>
          {saving ? 'Saving...' : mode === 'create' ? 'Create Project' : 'Save Changes'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
