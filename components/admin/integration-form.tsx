'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Field { key: string; label: string; placeholder: string; value: string; type?: string }

export function IntegrationForm({ title, fields, note }: { title: string; fields: Field[]; note?: string }) {
  const [values, setValues] = useState<Record<string, string>>(
    fields.reduce((acc, f) => ({ ...acc, [f.key]: f.value }), {})
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaving(true)
    for (const [key, value] of Object.entries(values)) {
      await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="bg-white rounded-lg border p-6 max-w-xl">
      <h2 className="font-semibold text-slate-900 mb-4">{title}</h2>
      {note && <p className="text-sm text-slate-500 mb-4 bg-slate-50 rounded p-3">{note}</p>}
      <div className="space-y-4">
        {fields.map(f => (
          <div key={f.key}>
            <Label>{f.label}</Label>
            <Input
              type={f.type ?? 'text'}
              placeholder={f.placeholder}
              value={values[f.key] ?? ''}
              onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
              className="mt-1"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-6">
        <Button onClick={save} disabled={saving} style={{ background: '#1a2744', color: 'white' }}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
      </div>
    </div>
  )
}
