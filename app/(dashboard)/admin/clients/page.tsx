import React from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'

export default async function ClientsAdminPage() {
  const session = await getServerSession(authOptions)
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes((session?.user as any)?.role)) redirect('/dashboard')

  const clients = await prisma.client.findMany({
    include: {
      _count: { select: { projects: true, users: true, orders: true } },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <Link href="/admin" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Admin Settings
      </Link>
      <PageHeader
        title="Client Management"
        description="Manage client accounts and their project access"
        actions={
          <Button asChild style={{ background: '#1a2744', color: 'white' }}>
            <Link href="/admin/clients/new"><Plus className="h-4 w-4 mr-1" />New Client</Link>
          </Button>
        }
      />
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Client Name</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Projects</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Users</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Orders</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">{client.code}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">{client.name}</td>
                <td className="px-4 py-3 text-right text-slate-600">{client._count.projects}</td>
                <td className="px-4 py-3 text-right text-slate-600">{client._count.users}</td>
                <td className="px-4 py-3 text-right text-slate-600">{client._count.orders}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/clients/${client.id}/edit`} className="text-xs text-blue-600 hover:underline">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && (
          <p className="px-4 py-8 text-sm text-slate-400 text-center">No clients found</p>
        )}
      </div>
    </div>
  )
}
