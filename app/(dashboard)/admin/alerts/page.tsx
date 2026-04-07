import React from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { AlertSettingsForm } from '@/components/admin/alert-settings-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function AlertsAdminPage() {
  const session = await getServerSession(authOptions)
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes((session?.user as any)?.role)) redirect('/dashboard')

  const settings = await prisma.systemSetting.findMany()
  const getVal = (key: string, fallback = '') => settings.find(s => s.key === key)?.value ?? fallback

  return (
    <div>
      <Link href="/admin" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Admin Settings
      </Link>
      <PageHeader
        title="Alert & Notification Settings"
        description="Configure email recipients and thresholds for automated alerts"
      />
      <AlertSettingsForm
        defaults={{
          low_stock_recipients: getVal('low_stock_recipients'),
          discrepancy_recipients: getVal('discrepancy_recipients'),
          order_ready_recipients: getVal('order_ready_recipients'),
          unexpected_package_recipients: getVal('unexpected_package_recipients'),
          aging_threshold_days: getVal('aging_threshold_days', '90'),
          low_stock_threshold_default: getVal('low_stock_threshold_default', '50'),
        }}
      />
    </div>
  )
}
