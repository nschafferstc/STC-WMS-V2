import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function PackagesPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const warehouseId = (session?.user as any)?.warehouseId

  const packages = await prisma.package.findMany({
    where: warehouseId ? { warehouse_id: warehouseId } : undefined,
    include: { warehouse: true, asn: true },
    orderBy: { createdAt: 'desc' },
  })

  const quarantined = packages.filter(p => p.status === 'QUARANTINED')
  const isAdmin = ['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes(role)

  return (
    <div>
      <PageHeader
        title="Packages"
        description="Parcel tracking — expected and unexpected inbound"
        actions={
          <Button asChild style={{ background: '#1a2744', color: 'white' }}>
            <Link href="/packages/new">
              <Plus className="h-4 w-4 mr-1" />Log Package
            </Link>
          </Button>
        }
      />

      {quarantined.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-900">
              {quarantined.length} package{quarantined.length > 1 ? 's' : ''} quarantined — STC approval required
            </div>
            <div className="text-sm text-red-700 mt-1">
              Unexpected inbound parcels pending disposition. Review and approve or reject below.
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Package</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Warehouse</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">ASN</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Carrier</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tracking #</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Notes</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Logged</th>
              {isAdmin && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {packages.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 9 : 8} className="px-4 py-12 text-center text-slate-400">
                  No packages found
                </td>
              </tr>
            ) : packages.map(pkg => (
              <tr
                key={pkg.id}
                className={`border-b border-slate-50 last:border-0 hover:bg-slate-50 ${pkg.status === 'QUARANTINED' ? 'bg-red-50/50' : ''}`}
              >
                <td className="px-4 py-3 font-mono text-xs font-medium">{pkg.code}</td>
                <td className="px-4 py-3 text-slate-600">{pkg.warehouse.stc_reference_name}</td>
                <td className="px-4 py-3 text-xs">
                  {pkg.asn?.code ?? (
                    <span className="text-red-500 font-medium">Unexpected</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{pkg.carrier ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs">{pkg.tracking ?? '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={pkg.status} /></td>
                <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{pkg.notes ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(pkg.createdAt)}</td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    {pkg.status === 'QUARANTINED' && (
                      <div className="flex gap-1">
                        <PackageActionButton packageId={pkg.id} action="APPROVED" />
                        <PackageActionButton packageId={pkg.id} action="REJECTED" />
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 bg-slate-50 border-t text-xs text-slate-500">
          {packages.length} packages · {quarantined.length} quarantined
        </div>
      </div>
    </div>
  )
}

function PackageActionButton({
  packageId,
  action,
}: {
  packageId: number
  action: 'APPROVED' | 'REJECTED'
}) {
  return (
    <form action={`/api/packages/${packageId}/status`} method="POST" className="inline">
      <input type="hidden" name="status" value={action} />
      <button
        type="submit"
        className={`text-xs px-2 py-1 rounded font-medium ${
          action === 'APPROVED'
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-red-100 text-red-700 hover:bg-red-200'
        }`}
      >
        {action === 'APPROVED' ? 'Approve' : 'Reject'}
      </button>
    </form>
  )
}
