import React from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { ProjectForm } from '@/components/admin/project-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  params: { id: string }
}

export default async function EditProjectPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes((session?.user as any)?.role)) redirect('/dashboard')

  const projectId = parseInt(params.id)
  if (isNaN(projectId)) notFound()

  const [project, clients] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.client.findMany({ orderBy: { name: 'asc' } }),
  ])

  if (!project) notFound()

  return (
    <div>
      <Link href="/admin/projects" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Project Management
      </Link>
      <PageHeader title={`Edit Project: ${project.name}`} description={`Code: ${project.code}`} />
      <ProjectForm
        mode="edit"
        projectId={project.id}
        clients={clients.map(c => ({ id: c.id, name: c.name, code: c.code }))}
        defaultValues={{
          code: project.code,
          name: project.name,
          client_id: project.client_id,
          isRollout: project.isRollout,
          aging_threshold_days: project.aging_threshold_days,
          dim_factor_override: project.dim_factor_override?.toString() ?? null,
        }}
      />
    </div>
  )
}
