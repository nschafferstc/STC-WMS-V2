import React from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
import {
  Users, Warehouse, Building2, FolderKanban, Package, Upload,
  QrCode, Bell, FileText, Scale, Plug, MapPin, ClipboardList, List
} from 'lucide-react'

const modules = [
  { href: '/admin/users', title: 'User & Role Management', description: 'Create, edit, deactivate users; assign roles, warehouses, and project scopes', icon: Users },
  { href: '/admin/clients', title: 'Client Management', description: 'Create and edit clients; assign projects; configure client-visible data scope', icon: Building2 },
  { href: '/admin/projects', title: 'Project Management', description: 'Create projects; assign warehouses, clients, BOL templates; manage store lists', icon: FolderKanban },
  { href: '/admin/warehouses', title: 'Warehouse Management', description: 'Edit warehouse profiles; assign users and projects; control name visibility', icon: Warehouse },
  { href: '/admin/skus', title: 'SKU Management', description: 'Bulk upload and edit SKUs; set dims and weight; configure thresholds', icon: Package },
  { href: '/admin/order-import', title: 'Order Import Settings', description: 'Configure field mapping for bulk uploads; manage import templates', icon: Upload },
  { href: '/admin/barcodes', title: 'Barcode / QR Settings', description: 'Select format; generate printable labels; define labeling conventions per project', icon: QrCode },
  { href: '/admin/alerts', title: 'Alert & Notification Settings', description: 'Configure email recipients per alert type; set thresholds for low stock and aging', icon: Bell },
  { href: '/admin/bol-templates', title: 'BOL / Document Templates', description: 'Create and edit PDF BOL and pack list templates; assign by project or warehouse', icon: FileText },
  { href: '/admin/dim-weight', title: 'Dimensional Weight Settings', description: 'Set global dimensional factor; override per project; configure chargeable weight', icon: Scale },
  { href: '/admin/integrations', title: 'Integration Settings', description: 'EDI/TMS, QuickBooks, SMTP, FedEx API, UPS API configuration', icon: Plug },
  { href: '/admin/airport-codes', title: 'ZIP / Airport Code Lookup', description: 'Search zip → airport code; view and override store airport codes', icon: MapPin },
]

const quickAccess = [
  { href: '/warehouses', title: 'Warehouse Directory', description: 'Browse all 183+ DCs and cross-dock facilities', icon: Warehouse },
  { href: '/projects', title: 'Projects Directory', description: 'View all active client projects', icon: ClipboardList },
  { href: '/packages', title: 'Packages', description: 'Track individual parcel-level shipment records', icon: Package },
  { href: '/audit', title: 'Audit Log', description: 'Full record of every system action and status change', icon: List },
]

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes(role)) redirect('/dashboard')

  return (
    <div>
      <PageHeader title="Admin Settings" description="System configuration and management — STC internal only" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {modules.map(m => {
          const Icon = m.icon
          return (
            <Link key={m.href} href={m.href}>
              <div className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer h-full">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-100 rounded-lg flex-shrink-0">
                    <Icon className="h-5 w-5 text-[#1a2744]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{m.title}</h3>
                    <p className="text-sm text-slate-500">{m.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mb-2">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {quickAccess.map(q => {
            const Icon = q.icon
            return (
              <Link key={q.href} href={q.href}>
                <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg flex-shrink-0">
                    <Icon className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 text-sm">{q.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{q.description}</div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
