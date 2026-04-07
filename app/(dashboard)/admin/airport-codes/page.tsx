import React from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { AirportCodeLookup } from '@/components/admin/airport-code-lookup'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function AirportCodesAdminPage() {
  const session = await getServerSession(authOptions)
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes((session?.user as any)?.role)) redirect('/dashboard')

  const stores = await prisma.store.findMany({
    include: { project: true, warehouse: true },
    orderBy: [{ region: 'asc' }, { store_num: 'asc' }],
    take: 100,
  })

  return (
    <div>
      <Link href="/admin" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Admin Settings
      </Link>
      <PageHeader
        title="ZIP / Airport Code Lookup"
        description="View and override store airport codes used for air cargo routing"
      />
      <AirportCodeLookup
        stores={stores.map(s => ({
          id: s.id,
          storeNum: s.store_num,
          zip: s.zip,
          airportCode: s.airport_code,
          city: s.city,
          state: s.state,
          warehouse: s.warehouse.stc_reference_name,
          project: s.project.name,
        }))}
      />
    </div>
  )
}
