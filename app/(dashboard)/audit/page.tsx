import React from 'react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PageHeader } from '@/components/shared/page-header'
import { formatDate } from '@/lib/utils'

export default async function AuditPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes(role)) {
    return <div className="p-8 text-center text-slate-500">Access restricted.</div>
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return (
    <div>
      <PageHeader title="Audit Log" description="Immutable record of all system actions" />
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Time</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Action</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Entity</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">No audit log entries yet</td></tr>
            ) : logs.map(log => (
              <tr key={log.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                <td className="px-4 py-3 text-slate-700">{log.user_name ?? '—'}</td>
                <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">{log.action}</span></td>
                <td className="px-4 py-3 text-slate-600">{log.entity}{log.entity_id ? ` #${log.entity_id}` : ''}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{log.details?.slice(0, 80) ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
