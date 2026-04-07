import React from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function BarcodesAdminPage() {
  const session = await getServerSession(authOptions)
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes((session?.user as any)?.role)) redirect('/dashboard')

  return (
    <div>
      <Link href="/admin" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Admin Settings
      </Link>
      <PageHeader
        title="Barcode / QR Settings"
        description="Select barcode format, generate printable labels, and define labeling conventions per project"
      />
      <div className="bg-white rounded-lg border p-8 text-center text-slate-400 text-sm">
        Barcode and QR label configuration coming soon.
      </div>
    </div>
  )
}
