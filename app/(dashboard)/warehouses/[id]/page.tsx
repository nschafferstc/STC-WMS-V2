import React from 'react'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function WarehouseDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const isAdmin = ['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes((session?.user as any)?.role)
  const whId = parseInt(params.id)

  const warehouse = await prisma.warehouse.findUnique({
    where: { id: whId },
    include: {
      inventory: {
        include: { sku: true },
        orderBy: { sku: { code: 'asc' } },
      },
      orders: {
        where: { status: { notIn: ['COMPLETE', 'CANCELLED'] } },
        include: { client: true, store: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      asns: {
        where: { status: { in: ['SCHEDULED', 'IN_TRANSIT'] } },
        include: { client: true, lines: { include: { sku: true } } },
        orderBy: { createdAt: 'desc' },
      },
      packages: {
        orderBy: { createdAt: 'desc' },
        take: 30,
      },
    },
  })

  if (!warehouse) notFound()

  return (
    <div>
      <Link href="/warehouses" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Warehouses
      </Link>

      <PageHeader
        title={warehouse.stc_reference_name}
        description={`${warehouse.code} · ${warehouse.address}, ${warehouse.city}, ${warehouse.state} ${warehouse.zip}`}
        actions={
          <Button asChild style={{ background: '#1a2744', color: 'white' }}>
            <Link href={`/receiving/new?warehouse=${warehouse.id}`}>New ASN Receipt</Link>
          </Button>
        }
      />

      {isAdmin && (
        <div className="mb-4 text-sm text-slate-500 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          Admin view — 3PL partner: <strong>{warehouse.company_name}</strong>
        </div>
      )}

      <Tabs defaultValue="inventory">
        <TabsList className="mb-6">
          <TabsTrigger value="inventory">Inventory ({warehouse.inventory.length})</TabsTrigger>
          <TabsTrigger value="orders">Active Orders ({warehouse.orders.length})</TabsTrigger>
          <TabsTrigger value="receiving">Receiving Queue ({warehouse.asns.length})</TabsTrigger>
          <TabsTrigger value="packages">Packages ({warehouse.packages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">On Hand</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Allocated</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Available</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {warehouse.inventory.map(inv => {
                  const available = inv.on_hand - inv.allocated
                  return (
                    <tr key={inv.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{inv.sku.code}</td>
                      <td className="px-4 py-3 text-slate-600">{inv.sku.description}</td>
                      <td className="px-4 py-3 text-right font-medium">{inv.on_hand}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{inv.allocated}</td>
                      <td className={`px-4 py-3 text-right font-bold ${available > 0 ? 'text-green-700' : 'text-red-600'}`}>{available}</td>
                      <td className="px-4 py-3">
                        {available <= 0
                          ? <span className="text-xs font-medium text-red-600">Out of Stock</span>
                          : available < 10
                          ? <span className="text-xs font-medium text-yellow-600">Low Stock</span>
                          : <span className="text-xs font-medium text-green-600">In Stock</span>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Store</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Load Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {warehouse.orders.map(order => (
                  <tr key={order.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/orders/${order.id}`} className="font-medium text-blue-600 hover:underline">{order.code}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{order.client.name}</td>
                    <td className="px-4 py-3 text-slate-600">{order.store?.store_num ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{order.load_type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="receiving">
          <div className="space-y-3">
            {warehouse.asns.map(asn => (
              <div key={asn.id} className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Link href={`/receiving/${asn.id}`} className="font-semibold text-blue-600 hover:underline">{asn.code}</Link>
                    <StatusBadge status={asn.status} />
                  </div>
                  <span className="text-sm text-slate-500">{asn.client.name}</span>
                </div>
                <div className="flex gap-4 text-sm text-slate-600">
                  {asn.lines.map(line => (
                    <span key={line.id}>{line.sku.code}: <strong>{line.expected_qty}</strong> expected</span>
                  ))}
                </div>
              </div>
            ))}
            {warehouse.asns.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No active ASNs in receiving queue</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="packages">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Package</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Carrier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tracking</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody>
                {warehouse.packages.map(pkg => (
                  <tr key={pkg.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{pkg.code}</td>
                    <td className="px-4 py-3 text-slate-600">{pkg.carrier ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{pkg.tracking ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={pkg.status} /></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{pkg.notes ?? '—'}</td>
                  </tr>
                ))}
                {warehouse.packages.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">No packages found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
