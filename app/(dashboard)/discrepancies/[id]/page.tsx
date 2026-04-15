'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function DiscrepancyDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [disc, setDisc] = useState<any>(null)
  const [resolution, setResolution] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/discrepancies/${params.id}`).then(r => r.json()).then(d => {
      setDisc(d)
      setResolution(d.resolution ?? '')
    })
  }, [params.id])

  const updateStatus = async (status: string) => {
    setSaving(true)
    setError('')
    const res = await fetch(`/api/discrepancies/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, resolution }),
    })
    if (res.ok) {
      const updated = await res.json()
      setDisc(updated)
    } else {
      setError('Failed to update')
    }
    setSaving(false)
  }

  if (!disc) return <div className="p-8 text-slate-500">Loading...</div>

  const discNum = `DISC-${String(disc.id).padStart(4, '0')}`
  const createdAt = new Date(disc.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      <Link href="/discrepancies" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Discrepancies
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 font-mono">{discNum}</h1>
            <StatusBadge status={disc.status} />
          </div>
          <div className="text-sm text-slate-500">Source: {disc.source_ref} · Logged {createdAt}</div>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Details card */}
          <div className="bg-white rounded-lg border p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Discrepancy Details</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-slate-500 uppercase font-medium mb-1">Type</div>
                <div className="font-medium">{disc.type.replace(/_/g, ' ')}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase font-medium mb-1">Source Reference</div>
                <div className="font-mono text-sm">{disc.source_ref}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-medium mb-1">Description</div>
              <div className="text-sm text-slate-700 bg-slate-50 rounded p-3">{disc.description}</div>
            </div>
          </div>

          {/* Resolution */}
          <div className="bg-white rounded-lg border p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Resolution Notes</h3>
            <textarea
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              disabled={disc.status === 'RESOLVED'}
              rows={4}
              placeholder="Document what was done to resolve this discrepancy..."
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500"
            />
            {disc.status === 'RESOLVED' && disc.resolution && (
              <p className="mt-2 text-xs text-slate-500">Resolved — editing disabled</p>
            )}
          </div>
        </div>

        {/* Actions sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Actions</h3>
            <div className="space-y-2">
              {disc.status === 'OPEN' && (
                <>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => updateStatus('UNDER_REVIEW')}
                    disabled={saving}
                  >
                    Mark Under Review
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => updateStatus('RESOLVED')}
                    disabled={saving || !resolution.trim()}
                    style={{ background: '#1a2744', color: 'white' }}
                  >
                    {saving ? 'Saving...' : 'Mark Resolved'}
                  </Button>
                </>
              )}
              {disc.status === 'UNDER_REVIEW' && (
                <Button
                  className="w-full"
                  onClick={() => updateStatus('RESOLVED')}
                  disabled={saving || !resolution.trim()}
                  style={{ background: '#1a2744', color: 'white' }}
                >
                  {saving ? 'Saving...' : 'Mark Resolved'}
                </Button>
              )}
              {disc.status === 'RESOLVED' && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => updateStatus('OPEN')}
                  disabled={saving}
                >
                  Re-open
                </Button>
              )}
              {!resolution.trim() && disc.status !== 'RESOLVED' && (
                <p className="text-xs text-amber-600">Add resolution notes before resolving</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border p-5 text-sm space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Timeline</div>
            <div className="flex justify-between">
              <span className="text-slate-500">Logged</span>
              <span>{new Date(disc.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Updated</span>
              <span>{new Date(disc.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
