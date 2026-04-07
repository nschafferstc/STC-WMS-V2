import React from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { ClientForm } from '@/components/admin/client-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewClientPage() {
  const session = await getServerSession(authOptions)
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes((session?.user as any)?.role)) redirect('/dashboard')

  return (
    <div>
      <Link href="/admin/clients" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Client Management
      </Link>
      <PageHeader title="Create New Client" description="Add a new client to the WMS" />
      <ClientForm mode="create" />
    </div>
  )
}
