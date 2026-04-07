import React from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'

export default async function ProjectsAdminPage() {
  const session = await getServerSession(authOptions)
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes((session?.user as any)?.role)) redirect('/dashboard')

  const projects = await prisma.project.findMany({
    include: {
      client: true,
      _count: { select: { stores: true } },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <Link href="/admin" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Admin Settings
      </Link>
      <PageHeader
        title="Project Management"
        description="Manage rollout projects, store lists, and BOL assignments"
        actions={
          <Button asChild style={{ background: '#1a2744', color: 'white' }}>
            <Link href="/admin/projects/new"><Plus className="h-4 w-4 mr-1" />New Project</Link>
          </Button>
        }
      />
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Project Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Client</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Stores</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Rollout</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Dim Factor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr key={project.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">{project.code}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">{project.name}</td>
                <td className="px-4 py-3 text-slate-600">{project.client.name}</td>
                <td className="px-4 py-3 text-right text-slate-600">{project._count.stores}</td>
                <td className="px-4 py-3">
                  {project.isRollout ? (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Rollout</span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">
                  {project.dim_factor_override ? project.dim_factor_override.toString() : <span className="text-slate-400">Global</span>}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/projects/${project.id}/edit`} className="text-xs text-blue-600 hover:underline">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 && (
          <p className="px-4 py-8 text-sm text-slate-400 text-center">No projects found</p>
        )}
      </div>
    </div>
  )
}
