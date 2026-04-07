import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { SKUManagement } from '@/components/admin/sku-management'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function SKUsAdminPage() {
  const session = await getServerSession(authOptions)
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes((session?.user as any)?.role)) redirect('/dashboard')

  const [skus, clients] = await Promise.all([
    prisma.sKU.findMany({
      include: { client: true },
      orderBy: [{ client_id: 'asc' }, { code: 'asc' }],
    }),
    prisma.client.findMany({ orderBy: { name: 'asc' } }),
  ])

  return (
    <div>
      <Link href="/admin" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Admin Settings
      </Link>
      <PageHeader title="SKU Management" description="Manage SKU catalog, dimensions, weights, and stock thresholds" />
      <SKUManagement
        skus={skus.map(s => ({
          id: s.id,
          code: s.code,
          name: s.name ?? '',
          description: s.description,
          clientId: s.client_id,
          clientName: s.client.name,
          dims_l: s.dims_l?.toString() ?? '',
          dims_w: s.dims_w?.toString() ?? '',
          dims_h: s.dims_h?.toString() ?? '',
          weight_lbs: s.weight_lbs?.toString() ?? '',
          units_per_pallet: s.units_per_pallet?.toString() ?? '',
          low_stock_threshold: s.low_stock_threshold?.toString() ?? '',
        }))}
        clients={clients.map(c => ({ id: c.id, name: c.name, code: c.code }))}
      />
    </div>
  )
}
