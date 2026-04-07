import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default async function BOLTemplatesAdminPage() {
  const session = await getServerSession(authOptions)
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes((session?.user as any)?.role)) redirect('/dashboard')

  const templates = await prisma.bOLTemplate.findMany({
    include: { project: { include: { client: true } } },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <Link href="/admin" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Admin Settings
      </Link>
      <PageHeader
        title="BOL / Document Templates"
        description="Manage PDF BOL and pack list templates assigned by project or warehouse"
      />
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Template Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Project</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Default</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(t => (
              <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{t.name}</td>
                <td className="px-4 py-3 text-slate-600">
                  {t.project ? `${t.project.name} (${t.project.client.name})` : <span className="text-slate-400">Global</span>}
                </td>
                <td className="px-4 py-3">
                  {t.isDefault ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Default</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(t.updatedAt)}</td>
              </tr>
            ))}
            {templates.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No templates found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
