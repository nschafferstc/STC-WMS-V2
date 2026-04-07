import React from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { UserForm } from '@/components/admin/user-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewUserPage() {
  const session = await getServerSession(authOptions)
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes((session?.user as any)?.role)) redirect('/dashboard')

  const [warehouses, clients] = await Promise.all([
    prisma.warehouse.findMany({ orderBy: { stc_reference_name: 'asc' } }),
    prisma.client.findMany({ orderBy: { name: 'asc' } }),
  ])

  return (
    <div>
      <Link href="/admin/users" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> User & Role Management
      </Link>
      <PageHeader title="Create New User" description="Add a new WMS user account" />
      <UserForm
        mode="create"
        warehouses={warehouses.map(w => ({ id: w.id, stc_reference_name: w.stc_reference_name, code: w.code }))}
        clients={clients.map(c => ({ id: c.id, name: c.name, code: c.code }))}
      />
    </div>
  )
}
