import React from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { DimWeightForm } from '@/components/admin/dim-weight-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function DimWeightAdminPage() {
  const session = await getServerSession(authOptions)
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes((session?.user as any)?.role)) redirect('/dashboard')

  const [dimFactorSetting, projects] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: 'dim_factor_global' } }),
    prisma.project.findMany({ include: { client: true }, orderBy: { name: 'asc' } }),
  ])

  return (
    <div>
      <Link href="/admin" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Admin Settings
      </Link>
      <PageHeader title="Dimensional Weight Settings" description="Configure dimensional factors used for chargeable weight calculations" />
      <DimWeightForm
        currentFactor={dimFactorSetting?.value ?? '194'}
        projects={projects.map(p => ({
          id: p.id,
          name: p.name,
          client: p.client.name,
          override: p.dim_factor_override?.toString() ?? null,
        }))}
      />
    </div>
  )
}
