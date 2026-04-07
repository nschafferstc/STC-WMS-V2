'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const STANDARD_FACTORS = ['194', '200', '250']

interface Project { id: number; name: string; client: string; override: string | null }

export function DimWeightForm({ currentFactor, projects }: { currentFactor: string; projects: Project[] }) {
  const [factor, setFactor] = useState(STANDARD_FACTORS.includes(currentFactor) ? currentFactor : 'custom')
  const [customFactor, setCustomFactor] = useState(STANDARD_FACTORS.includes(currentFactor) ? '' : currentFactor)
  const [projectOverrides, setProjectOverrides] = useState<Record<number, string>>(
    projects.reduce((acc, p) => ({ ...acc, [p.id]: p.override ?? '' }), {})
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaving(true)
    const effectiveFactor = factor === 'custom' ? customFactor : factor
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'dim_factor_global', value: effectiveFactor }),
    })
    // Save project overrides
    for (const [projectId, override] of Object.entries(projectOverrides)) {
      await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dim_factor_override: override || null }),
      })
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Global Dimensional Factor</h2>
        <p className="text-sm text-slate-500 mb-4">Formula: (L × W × H) ÷ Dim Factor = Dimensional Weight. Chargeable Weight = max(Actual, Dimensional).</p>
        <div className="flex gap-4 mb-4">
          {STANDARD_FACTORS.map(f => (
            <label key={f} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="factor" value={f} checked={factor === f} onChange={() => setFactor(f)} className="w-4 h-4" />
              <span className="font-medium">{f}</span>
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="factor" value="custom" checked={factor === 'custom'} onChange={() => setFactor('custom')} className="w-4 h-4" />
            <span className="font-medium">Custom</span>
          </label>
          {factor === 'custom' && (
            <Input value={customFactor} onChange={e => setCustomFactor(e.target.value)} placeholder="e.g. 166" className="w-24" type="number" />
          )}
        </div>
        <div className="text-sm text-slate-600 bg-slate-50 rounded p-3">
          Current factor: <strong>{factor === 'custom' ? customFactor || '—' : factor}</strong>
          {' '}| Example: 48×40×60 box ÷ {factor === 'custom' ? customFactor || '?' : factor} = <strong>{(48 * 40 * 60 / (parseFloat(factor === 'custom' ? customFactor : factor) || 194)).toFixed(1)} lbs</strong> dim weight
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Per-Project Overrides</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Project</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Client</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Dim Factor Override</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-2 font-medium">{p.name}</td>
                <td className="px-4 py-2 text-slate-500">{p.client}</td>
                <td className="px-4 py-2">
                  <Input
                    type="number"
                    placeholder={`Default (${factor === 'custom' ? customFactor || '194' : factor})`}
                    value={projectOverrides[p.id] ?? ''}
                    onChange={e => setProjectOverrides(prev => ({ ...prev, [p.id]: e.target.value }))}
                    className="w-32"
                  />
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400 text-sm">No projects found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving} style={{ background: '#1a2744', color: 'white' }}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        {saved && <span className="text-sm text-green-600 font-medium">Settings saved!</span>}
      </div>
    </div>
  )
}
