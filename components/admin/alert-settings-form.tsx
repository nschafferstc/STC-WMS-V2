'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AlertDefaults {
  low_stock_recipients: string
  discrepancy_recipients: string
  order_ready_recipients: string
  unexpected_package_recipients: string
  aging_threshold_days: string
  low_stock_threshold_default: string
}

export function AlertSettingsForm({ defaults }: { defaults: AlertDefaults }) {
  const [values, setValues] = useState(defaults)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof AlertDefaults) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues(prev => ({ ...prev, [key]: e.target.value }))

  const save = async () => {
    setSaving(true)
    setError(null)

    try {
      const entries = Object.entries(values)
      for (const [key, value] of entries) {
        const res = await fetch('/api/admin/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.error ?? `Failed to save setting: ${key}`)
          setSaving(false)
          return
        }
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Email Recipients */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="font-semibold text-slate-900 mb-1">Email Recipients</h2>
        <p className="text-sm text-slate-500 mb-5">Enter comma-separated email addresses for each alert type</p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="low_stock_recipients">Low Stock Alerts</Label>
            <Input
              id="low_stock_recipients"
              value={values.low_stock_recipients}
              onChange={set('low_stock_recipients')}
              className="mt-1"
              placeholder="ops@shipstc.com, manager@shipstc.com"
            />
          </div>

          <div>
            <Label htmlFor="discrepancy_recipients">Discrepancy / Damage Alerts</Label>
            <Input
              id="discrepancy_recipients"
              value={values.discrepancy_recipients}
              onChange={set('discrepancy_recipients')}
              className="mt-1"
              placeholder="ops@shipstc.com, quality@shipstc.com"
            />
          </div>

          <div>
            <Label htmlFor="order_ready_recipients">Order Ready for Pickup</Label>
            <Input
              id="order_ready_recipients"
              value={values.order_ready_recipients}
              onChange={set('order_ready_recipients')}
              className="mt-1"
              placeholder="shipping@shipstc.com"
            />
          </div>

          <div>
            <Label htmlFor="unexpected_package_recipients">Unexpected Package Received</Label>
            <Input
              id="unexpected_package_recipients"
              value={values.unexpected_package_recipients}
              onChange={set('unexpected_package_recipients')}
              className="mt-1"
              placeholder="receiving@shipstc.com, ops@shipstc.com"
            />
          </div>
        </div>
      </div>

      {/* Thresholds */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="font-semibold text-slate-900 mb-1">Alert Thresholds</h2>
        <p className="text-sm text-slate-500 mb-5">These defaults apply globally; individual projects may override aging thresholds</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="aging_threshold_days">Aging Inventory Threshold (days)</Label>
            <Input
              id="aging_threshold_days"
              type="number"
              value={values.aging_threshold_days}
              onChange={set('aging_threshold_days')}
              className="mt-1 w-32"
              placeholder="90"
              min={1}
              max={365}
            />
            <p className="text-xs text-slate-400 mt-1">Alert when inventory is older than this</p>
          </div>

          <div>
            <Label htmlFor="low_stock_threshold_default">Default Low Stock Threshold (units)</Label>
            <Input
              id="low_stock_threshold_default"
              type="number"
              value={values.low_stock_threshold_default}
              onChange={set('low_stock_threshold_default')}
              className="mt-1 w-32"
              placeholder="50"
              min={0}
            />
            <p className="text-xs text-slate-400 mt-1">Applied when no per-SKU threshold is set</p>
          </div>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-4 py-2">{error}</div>}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving} style={{ background: '#1a2744', color: 'white' }}>
          {saving ? 'Saving...' : 'Save Alert Settings'}
        </Button>
        {saved && <span className="text-sm text-green-600 font-medium">Settings saved!</span>}
      </div>
    </div>
  )
}
