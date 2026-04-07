import React from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { ProjectForm } from '@/components/admin/project-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewProjectPage() {
  const session = await getServerSession(authOptions)
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes((session?.user as any)?.role)) redirect('/dashboard')

  const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } })

  return (
    <div>
      <Link href="/admin/projects" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Project Management
      </Link>
      <PageHeader title="Create New Project" description="Add a new project to the WMS" />
      <ProjectForm
        mode="create"
        clients={clients.map(c => ({ id: c.id, name: c.name, code: c.code }))}
      />
    </div>
  )
}
