import React from 'react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function TransfersPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const canCreate = ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR'].includes(role)

  const transfers = await prisma.transferOrder.findMany({
    include: { from_warehouse: true, to_warehouse: true, lines: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <PageHeader
        title="Transfer Orders"
        description="Inter-warehouse inventory transfers"
        actions={canCreate && (
          <Button asChild style={{ background: '#1a2744', color: 'white' }}>
            <Link href="/transfers/new"><Plus className="h-4 w-4 mr-1" />New Transfer</Link>
          </Button>
        )}
      />
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">From</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">To</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Lines</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Created</th>
            </tr>
          </thead>
          <tbody>
            {transfers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No transfer orders yet</td></tr>
            ) : transfers.map(t => (
              <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3"><Link href={`/transfers/${t.id}`} className="font-mono text-xs text-blue-600 hover:underline">{t.code}</Link></td>
                <td className="px-4 py-3 text-slate-700">{t.from_warehouse.stc_reference_name}</td>
                <td className="px-4 py-3 text-slate-700">{t.to_warehouse.stc_reference_name}</td>
                <td className="px-4 py-3 text-slate-600">{t.lines.length}</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(t.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
