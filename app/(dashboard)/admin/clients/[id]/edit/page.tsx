import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { ClientForm } from '@/components/admin/client-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  params: { id: string }
}

export default async function EditClientPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes((session?.user as any)?.role)) redirect('/dashboard')

  const clientId = parseInt(params.id)
  if (isNaN(clientId)) notFound()

  const client = await prisma.client.findUnique({ where: { id: clientId } })
  if (!client) notFound()

  return (
    <div>
      <Link href="/admin/clients" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Client Management
      </Link>
      <PageHeader title={`Edit Client: ${client.name}`} description={`Code: ${client.code}`} />
      <ClientForm
        mode="edit"
        clientId={client.id}
        defaultValues={{ code: client.code, name: client.name }}
      />
    </div>
  )
}
