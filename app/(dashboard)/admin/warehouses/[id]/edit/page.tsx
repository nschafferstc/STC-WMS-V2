import React from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { WarehouseForm } from '@/components/admin/warehouse-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  params: { id: string }
}

export default async function EditWarehousePage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes((session?.user as any)?.role)) redirect('/dashboard')

  const warehouseId = parseInt(params.id)
  if (isNaN(warehouseId)) notFound()

  const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } })
  if (!warehouse) notFound()

  return (
    <div>
      <Link href="/admin/warehouses" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Warehouse Management
      </Link>
      <PageHeader title={`Edit Warehouse: ${warehouse.stc_reference_name}`} description={warehouse.company_name} />
      <WarehouseForm
        warehouseId={warehouse.id}
        defaultValues={{
          code: warehouse.code,
          company_name: warehouse.company_name,
          stc_reference_name: warehouse.stc_reference_name,
          address: warehouse.address,
          city: warehouse.city,
          state: warehouse.state,
          zip: warehouse.zip,
        }}
      />
    </div>
  )
}
