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

export default async function ReturnsPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const canCreate = ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR', 'WAREHOUSE_OPS'].includes(role)

  const returns = await prisma.return.findMany({
    include: { warehouse: true, client: true, lines: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <PageHeader
        title="Returns"
        description="Inbound returns from job sites, customers, and vendors"
        actions={canCreate && (
          <Button asChild style={{ background: '#1a2744', color: 'white' }}>
            <Link href="/returns/new"><Plus className="h-4 w-4 mr-1" />New Return</Link>
          </Button>
        )}
      />
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Client</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Warehouse</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Lines</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
            </tr>
          </thead>
          <tbody>
            {returns.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No returns yet</td></tr>
            ) : returns.map(r => (
              <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3"><Link href={`/returns/${r.id}`} className="font-mono text-xs text-blue-600 hover:underline">{r.code}</Link></td>
                <td className="px-4 py-3 text-slate-700">{r.client.name}</td>
                <td className="px-4 py-3 text-slate-600">{r.warehouse.stc_reference_name}</td>
                <td className="px-4 py-3 text-slate-600">{r.return_type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-slate-600">{r.lines.length}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
