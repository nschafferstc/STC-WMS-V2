import React from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IntegrationForm } from '@/components/admin/integration-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function IntegrationsAdminPage() {
  const session = await getServerSession(authOptions)
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes((session?.user as any)?.role)) redirect('/dashboard')

  const settings = await prisma.systemSetting.findMany()
  const getVal = (key: string) => settings.find(s => s.key === key)?.value ?? ''

  return (
    <div>
      <Link href="/admin" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Admin Settings
      </Link>
      <PageHeader title="Integration Settings" description="Configure external system connections" />
      <Tabs defaultValue="smtp">
        <TabsList className="mb-6">
          <TabsTrigger value="smtp">Email (SMTP)</TabsTrigger>
          <TabsTrigger value="fedex">FedEx</TabsTrigger>
          <TabsTrigger value="ups">UPS</TabsTrigger>
          <TabsTrigger value="quickbooks">QuickBooks</TabsTrigger>
          <TabsTrigger value="edi">EDI / TMS</TabsTrigger>
        </TabsList>
        <TabsContent value="smtp">
          <IntegrationForm title="SMTP Email Configuration" fields={[
            { key: 'smtp_host', label: 'SMTP Host', placeholder: 'smtp.example.com', value: getVal('smtp_host') },
            { key: 'smtp_port', label: 'SMTP Port', placeholder: '587', value: getVal('smtp_port') },
            { key: 'smtp_user', label: 'SMTP Username', placeholder: 'noreply@shipstc.com', value: getVal('smtp_user') },
            { key: 'smtp_pass', label: 'SMTP Password', placeholder: '••••••••', value: getVal('smtp_pass'), type: 'password' },
          ]} />
        </TabsContent>
        <TabsContent value="fedex">
          <IntegrationForm title="FedEx API Configuration" fields={[
            { key: 'fedex_api_key', label: 'FedEx API Key', placeholder: 'Enter FedEx client ID', value: getVal('fedex_api_key') },
            { key: 'fedex_api_secret', label: 'FedEx API Secret', placeholder: '••••••••', value: getVal('fedex_api_secret'), type: 'password' },
          ]} note="Credentials are used for parcel tracking. Obtain from developer.fedex.com" />
        </TabsContent>
        <TabsContent value="ups">
          <IntegrationForm title="UPS API Configuration" fields={[
            { key: 'ups_api_key', label: 'UPS API Key', placeholder: 'Enter UPS OAuth key', value: getVal('ups_api_key') },
          ]} note="Credentials are used for parcel tracking. Obtain from developer.ups.com" />
        </TabsContent>
        <TabsContent value="quickbooks">
          <IntegrationForm title="QuickBooks Online Configuration" fields={[
            { key: 'qb_client_id', label: 'Client ID', placeholder: 'QB App Client ID', value: getVal('qb_client_id') },
            { key: 'qb_client_secret', label: 'Client Secret', placeholder: '••••••••', value: getVal('qb_client_secret'), type: 'password' },
            { key: 'qb_realm_id', label: 'Company ID (Realm ID)', placeholder: 'Your QBO Company ID', value: getVal('qb_realm_id') },
          ]} note="OAuth 2.0 — after saving Client ID and Secret, complete OAuth flow in QuickBooks developer portal" />
        </TabsContent>
        <TabsContent value="edi">
          <IntegrationForm title="EDI / TMS Configuration" fields={[
            { key: 'edi_partner_id', label: 'EDI Partner ID', placeholder: 'TMS Partner ISA ID', value: getVal('edi_partner_id') },
            { key: 'edi_qualifier', label: 'ISA Qualifier', placeholder: 'ZZ', value: getVal('edi_qualifier') },
          ]} note="Used for EDI 214 shipment status exports. Configure with your TMS provider." />
        </TabsContent>
      </Tabs>
    </div>
  )
}
