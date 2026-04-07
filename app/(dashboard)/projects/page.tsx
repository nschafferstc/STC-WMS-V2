import React from 'react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, FolderKanban } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions)
  const isAdmin = ['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes((session?.user as any)?.role)

  const projects = await prisma.project.findMany({
    include: {
      client: true,
      _count: { select: { stores: true, skus: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Client engagements and rollout programs"
        actions={
          isAdmin && (
            <Button asChild style={{ background: '#1a2744', color: 'white' }}>
              <Link href="/admin/projects/new"><Plus className="h-4 w-4 mr-1" />New Project</Link>
            </Button>
          )
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to get started."
          icon={FolderKanban}
          action={isAdmin ? { label: 'New Project', href: '/admin/projects/new' } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(project => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer h-full">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1">{project.code}</div>
                    <h3 className="font-semibold text-slate-900">{project.name}</h3>
                  </div>
                  {project.isRollout && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Rollout</span>
                  )}
                </div>
                <div className="text-sm text-slate-600 mb-4">
                  <span className="font-medium">{project.client.name}</span>
                </div>
                <div className="flex gap-4 text-sm text-slate-500">
                  <div><span className="font-semibold text-slate-800">{project._count.stores}</span> Stores</div>
                  <div><span className="font-semibold text-slate-800">{project._count.skus}</span> SKUs</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
