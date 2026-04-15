'use client'
import React, { useState, useEffect } from 'react'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ReturnDetailPage({ params }: { params: { id: string } }) {
  const [ret, setRet] = useState<any>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const load = () => fetch(`/api/returns/${params.id}`).then(r => r.json()).then(setRet)
  useEffect(() => { load() }, [params.id])

  const action = async (status: string) => {
    setLoading(status)
    await fetch(`/api/returns/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await load()
    setLoading(null)
  }

  if (!ret) return <div className="p-8 text-slate-500">Loading...</div>

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString() : '—'

  return (
    <div>
      <Link href="/returns" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Returns
      </Link>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 font-mono">{ret.code}</h1>
            <StatusBadge status={ret.status} />
          </div>
          <div className="text-sm text-slate-500">
            {ret.client?.name} · {ret.warehouse?.stc_reference_name} · {ret.return_type?.replace(/_/g, ' ')}
          </div>
        </div>
        <div className="flex gap-2">
          {ret.status === 'PENDING' && (
            <Button onClick={() => action('RECEIVED')} disabled={loading === 'RECEIVED'} style={{ background: '#1a2744', color: 'white' }} size="sm">
              {loading === 'RECEIVED' ? '...' : 'Mark Received'}
            </Button>
          )}
          {ret.status === 'RECEIVED' && (
            <>
              <Button onClick={() => action('RESTOCKED')} disabled={!!loading} style={{ background: '#1a2744', color: 'white' }} size="sm">
                {loading === 'RESTOCKED' ? '...' : 'Restock to Inventory'}
              </Button>
              <Button onClick={() => action('QUARANTINED')} disabled={!!loading} variant="outline" size="sm" className="text-yellow-700 border-yellow-300">
                {loading === 'QUARANTINED' ? '...' : 'Send to Quarantine'}
              </Button>
              <Button onClick={() => action('RETURNED_TO_VENDOR')} disabled={!!loading} variant="outline" size="sm">
                {loading === 'RETURNED_TO_VENDOR' ? '...' : 'Return to Vendor'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Status</span><StatusBadge status={ret.status} /></div>
              <div className="flex justify-between"><span className="text-slate-500">Type</span><span>{ret.return_type?.replace(/_/g, ' ')}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Client</span><span className="font-medium">{ret.client?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Warehouse</span><span>{ret.warehouse?.stc_reference_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Created</span><span>{fmt(ret.createdAt)}</span></div>
              {ret.received_at && <div className="flex justify-between"><span className="text-slate-500">Received</span><span>{fmt(ret.received_at)}</span></div>}
            </div>
            {ret.notes && <div className="mt-3 pt-3 border-t text-sm text-slate-600">{ret.notes}</div>}
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold">Returned Items</h3></div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">SKU</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Condition</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody>
                {(ret.lines ?? []).map((line: any) => (
                  <tr key={line.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3"><div className="font-mono text-xs">{line.sku?.code}</div><div className="text-xs text-slate-500">{line.sku?.description?.slice(0, 50)}</div></td>
                    <td className="px-4 py-3 text-right font-medium">{line.qty}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${line.condition === 'GOOD' ? 'bg-green-100 text-green-700' : line.condition === 'DAMAGED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {line.condition}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{line.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
