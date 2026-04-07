'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ROLES = [
  { value: 'STC_EXECUTIVE', label: 'STC Executive' },
  { value: 'STC_OPS_MANAGER', label: 'STC Ops Manager' },
  { value: 'STC_COORDINATOR', label: 'STC Coordinator' },
  { value: 'STC_READ_ONLY', label: 'Read Only' },
  { value: 'WAREHOUSE_OPS', label: 'Warehouse Ops' },
  { value: 'CLIENT_USER', label: 'Client User' },
]

interface Warehouse { id: number; stc_reference_name: string; code: string }
interface Client { id: number; name: string; code: string }

interface UserFormProps {
  mode: 'create' | 'edit'
  userId?: number
  defaultValues?: {
    name: string
    email: string
    role: string
    warehouse_id: number | null
    client_id: number | null
    isActive: boolean
  }
  warehouses: Warehouse[]
  clients: Client[]
}

export function UserForm({ mode, userId, defaultValues, warehouses, clients }: UserFormProps) {
  const router = useRouter()
  const [name, setName] = useState(defaultValues?.name ?? '')
  const [email, setEmail] = useState(defaultValues?.email ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(defaultValues?.role ?? 'WAREHOUSE_OPS')
  const [warehouseId, setWarehouseId] = useState<string>(defaultValues?.warehouse_id?.toString() ?? '')
  const [clientId, setClientId] = useState<string>(defaultValues?.client_id?.toString() ?? '')
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const body: Record<string, any> = {
      name,
      email,
      role,
      isActive,
      warehouse_id: role === 'WAREHOUSE_OPS' && warehouseId ? parseInt(warehouseId) : null,
      client_id: role === 'CLIENT_USER' && clientId ? parseInt(clientId) : null,
    }
    if (password) body.password = password

    try {
      const url = mode === 'create' ? '/api/admin/users' : `/api/admin/users/${userId}`
      const method = mode === 'create' ? 'POST' : 'PATCH'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to save user')
        setSaving(false)
        return
      }

      router.push('/admin/users')
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
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1" placeholder="Jane Smith" />
      </div>

      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1" placeholder="jane@shipstc.com" />
      </div>

      <div>
        <Label htmlFor="password">
          Password {mode === 'edit' && <span className="text-slate-400 font-normal">(leave blank to keep unchanged)</span>}
        </Label>
        <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1" placeholder={mode === 'edit' ? '••••••••' : 'Set initial password'} required={mode === 'create'} />
      </div>

      <div>
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          value={role}
          onChange={e => setRole(e.target.value)}
          className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          {ROLES.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {role === 'WAREHOUSE_OPS' && (
        <div>
          <Label htmlFor="warehouse">Assigned Warehouse</Label>
          <select
            id="warehouse"
            value={warehouseId}
            onChange={e => setWarehouseId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">— None —</option>
            {warehouses.map(wh => (
              <option key={wh.id} value={wh.id}>{wh.stc_reference_name} ({wh.code})</option>
            ))}
          </select>
        </div>
      )}

      {role === 'CLIENT_USER' && (
        <div>
          <Label htmlFor="client">Assigned Client</Label>
          <select
            id="client"
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">— None —</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          checked={isActive}
          onChange={e => setIsActive(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300"
        />
        <Label htmlFor="isActive" className="cursor-pointer">Active (can log in)</Label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving} style={{ background: '#1a2744', color: 'white' }}>
          {saving ? 'Saving...' : mode === 'create' ? 'Create User' : 'Save Changes'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
