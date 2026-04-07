import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function ReceivingPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const warehouseId = (session?.user as any)?.warehouseId
  const canCreate = ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR'].includes(role)

  const asns = await prisma.aSN.findMany({
    where: warehouseId ? { warehouse_id: warehouseId } : undefined,
    include: {
      client: true,
      warehouse: true,
      lines: { include: { sku: true } },
      receipts: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <PageHeader
        title="Receiving"
        description="Advance Shipment Notices and inbound receipts"
        actions={
          canCreate && (
            <Button asChild style={{ background: '#1a2744', color: 'white' }}>
              <Link href="/receiving/new">
                <Plus className="h-4 w-4 mr-1" />New ASN
              </Link>
            </Button>
          )
        }
      />

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">ASN</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Client</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Warehouse</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Lines</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Receipts</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Created</th>
            </tr>
          </thead>
          <tbody>
            {asns.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  No ASNs found
                </td>
              </tr>
            ) : (
              asns.map(asn => (
                <tr key={asn.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/receiving/${asn.id}`}
                      className="font-medium text-blue-600 hover:underline font-mono text-xs"
                    >
                      {asn.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{asn.client.name}</td>
                  <td className="px-4 py-3 text-slate-600">{asn.warehouse.stc_reference_name}</td>
                  <td className="px-4 py-3 text-slate-600">{asn.lines.length}</td>
                  <td className="px-4 py-3 text-slate-600">{asn.receipts.length}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={asn.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(asn.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
