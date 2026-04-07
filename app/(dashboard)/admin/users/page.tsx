import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, ArrowLeft } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  STC_EXECUTIVE: 'STC Executive',
  STC_OPS_MANAGER: 'STC Ops Manager',
  STC_COORDINATOR: 'STC Coordinator',
  STC_READ_ONLY: 'Read Only',
  WAREHOUSE_OPS: 'Warehouse Ops',
  CLIENT_USER: 'Client',
}

export default async function UsersAdminPage() {
  const session = await getServerSession(authOptions)
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes((session?.user as any)?.role)) redirect('/dashboard')

  const users = await prisma.user.findMany({
    include: { warehouse: true, client: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <Link href="/admin" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Admin Settings
      </Link>
      <PageHeader
        title="User & Role Management"
        description="Manage WMS user accounts, roles, and access scopes"
        actions={
          <Button asChild style={{ background: '#1a2744', color: 'white' }}>
            <Link href="/admin/users/new"><Plus className="h-4 w-4 mr-1" />New User</Link>
          </Button>
        }
      />
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Warehouse</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Client</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                <td className="px-4 py-3 text-slate-600">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full font-medium">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{user.warehouse?.stc_reference_name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{user.client?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${user.id}/edit`} className="text-xs text-blue-600 hover:underline">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
