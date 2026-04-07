import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function WarehousesAdminPage() {
  const session = await getServerSession(authOptions)
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes((session?.user as any)?.role)) redirect('/dashboard')

  const warehouses = await prisma.warehouse.findMany({
    include: { _count: { select: { users: true, orders: true } } },
    orderBy: { code: 'asc' },
  })

  return (
    <div>
      <Link href="/admin" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Admin Settings
      </Link>
      <PageHeader title="Warehouse Management" description="STC DC locations and 3PL partner details" />
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">STC Reference Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">3PL Partner (Admin Only)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Location</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Users</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Orders</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {warehouses.map(wh => (
              <tr key={wh.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs font-medium">{wh.code}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">{wh.stc_reference_name}</td>
                <td className="px-4 py-3 text-slate-600">{wh.company_name}</td>
                <td className="px-4 py-3 text-slate-500">{wh.city}, {wh.state}</td>
                <td className="px-4 py-3 text-right">{wh._count.users}</td>
                <td className="px-4 py-3 text-right">{wh._count.orders}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/warehouses/${wh.id}/edit`} className="text-xs text-blue-600 hover:underline">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
