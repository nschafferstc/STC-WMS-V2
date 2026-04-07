import React from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { UserForm } from '@/components/admin/user-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  params: { id: string }
}

export default async function EditUserPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes((session?.user as any)?.role)) redirect('/dashboard')

  const userId = parseInt(params.id)
  if (isNaN(userId)) notFound()

  const [user, warehouses, clients] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.warehouse.findMany({ orderBy: { stc_reference_name: 'asc' } }),
    prisma.client.findMany({ orderBy: { name: 'asc' } }),
  ])

  if (!user) notFound()

  return (
    <div>
      <Link href="/admin/users" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> User & Role Management
      </Link>
      <PageHeader title={`Edit User: ${user.name}`} description={user.email} />
      <UserForm
        mode="edit"
        userId={user.id}
        defaultValues={{
          name: user.name,
          email: user.email,
          role: user.role,
          warehouse_id: user.warehouse_id,
          client_id: user.client_id,
          isActive: user.isActive,
        }}
        warehouses={warehouses.map(w => ({ id: w.id, stc_reference_name: w.stc_reference_name, code: w.code }))}
        clients={clients.map(c => ({ id: c.id, name: c.name, code: c.code }))}
      />
    </div>
  )
}
