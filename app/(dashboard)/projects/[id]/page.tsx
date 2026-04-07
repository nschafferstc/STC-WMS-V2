import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, MapPin } from 'lucide-react'

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      client: true,
      stores: { include: { warehouse: true }, orderBy: [{ region: 'asc' }, { city: 'asc' }] },
      skus: { include: { sku: { include: { inventory: { include: { warehouse: true } } } } } },
      _count: { select: { stores: true } },
    },
  })

  if (!project) notFound()

  // Get orders for this project's client
  const orders = await prisma.order.findMany({
    where: { client_id: project.client_id },
    include: { warehouse: true, store: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // Group stores by region for rollout projects
  const storesByRegion = project.stores.reduce((acc, store) => {
    if (!acc[store.region]) acc[store.region] = []
    acc[store.region].push(store)
    return acc
  }, {} as Record<string, typeof project.stores>)

  // Count orders by store for rollout projects
  const ordersByStoreId = orders.reduce((acc, order) => {
    if (order.store_id) {
      if (!acc[order.store_id]) acc[order.store_id] = []
      acc[order.store_id].push(order)
    }
    return acc
  }, {} as Record<number, typeof orders>)

  return (
    <div>
      <Link href="/projects" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Projects
      </Link>

      <PageHeader
        title={project.name}
        description={`${project.code} · ${project.client.name}${project.isRollout ? ' · Rollout Project' : ''}`}
        actions={
          <Button asChild variant="outline">
            <Link href={`/orders/new?project=${project.id}`}>Create Order</Link>
          </Button>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          {project.isRollout && <TabsTrigger value="stores">Stores ({project._count.stores})</TabsTrigger>}
          <TabsTrigger value="skus">SKUs ({project.skus.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border p-5">
              <div className="text-xs text-slate-500 uppercase font-medium mb-1">Client</div>
              <div className="text-lg font-semibold">{project.client.name}</div>
              <div className="text-sm text-slate-500">{project.client.code}</div>
            </div>
            <div className="bg-white rounded-lg border p-5">
              <div className="text-xs text-slate-500 uppercase font-medium mb-1">Total Stores</div>
              <div className="text-3xl font-bold">{project._count.stores}</div>
            </div>
            <div className="bg-white rounded-lg border p-5">
              <div className="text-xs text-slate-500 uppercase font-medium mb-1">Order Pipeline</div>
              <div className="flex gap-3 mt-1">
                {['READY', 'ALLOCATED', 'PARTIAL', 'COMPLETE'].map(status => {
                  const count = orders.filter(o => o.status === status).length
                  if (count === 0) return null
                  return (
                    <div key={status} className="text-center">
                      <div className="text-xl font-bold">{count}</div>
                      <StatusBadge status={status} />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </TabsContent>

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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Warehouse</th>
                </tr>
              </thead>
              <tbody>
                {project.skus.flatMap(ps =>
                  ps.sku.inventory.map(inv => (
                    <tr key={`${ps.sku_id}-${inv.warehouse_id}`} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">{ps.sku.code}</td>
                      <td className="px-4 py-3 text-slate-600">{ps.sku.description}</td>
                      <td className="px-4 py-3 text-right font-medium">{inv.on_hand}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{inv.allocated}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-700">{inv.on_hand - inv.allocated}</td>
                      <td className="px-4 py-3 text-slate-600">{inv.warehouse.stc_reference_name}</td>
                    </tr>
                  ))
                )}
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Store</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Warehouse</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Load Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
                    <td className="px-4 py-3">
                      <Link href={`/orders/${order.id}`} className="font-medium text-blue-600 hover:underline">{order.code}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{order.store ? `#${order.store.store_num}` : '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{order.warehouse.stc_reference_name}</td>
                    <td className="px-4 py-3 text-slate-600">{order.load_type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {project.isRollout && (
          <TabsContent value="stores">
            {/* Store progress grid by region */}
            {Object.entries(storesByRegion).map(([region, stores]) => (
              <div key={region} className="mb-6">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {region} ({stores.length} stores)
                </h3>
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Store #</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Address</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">City, State</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Airport</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Warehouse</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Order Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stores.map(store => {
                        const storeOrders = ordersByStoreId[store.id] ?? []
                        const latestOrder = storeOrders[0]
                        return (
                          <tr key={store.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                            <td className="px-4 py-2 font-medium">{store.store_num}</td>
                            <td className="px-4 py-2 text-slate-600 text-xs">{store.address}</td>
                            <td className="px-4 py-2 text-slate-600 text-xs">{store.city}, {store.state}</td>
                            <td className="px-4 py-2 font-mono text-xs font-medium">{store.airport_code}</td>
                            <td className="px-4 py-2 text-xs">{store.warehouse.stc_reference_name}</td>
                            <td className="px-4 py-2">
                              {latestOrder ? <StatusBadge status={latestOrder.status} /> : <span className="text-xs text-slate-400">No order</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </TabsContent>
        )}

        <TabsContent value="skus">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name / Description</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">L×W×H (in)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Weight</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Per Pallet</th>
                </tr>
              </thead>
              <tbody>
                {project.skus.map(ps => (
                  <tr key={ps.sku_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">{ps.sku.code}</td>
                    <td className="px-4 py-3">
                      {ps.sku.name && <div className="font-medium text-slate-800">{ps.sku.name}</div>}
                      <div className="text-slate-500 text-xs">{ps.sku.description}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 font-mono text-xs">
                      {ps.sku.dims_l && ps.sku.dims_w && ps.sku.dims_h
                        ? `${ps.sku.dims_l}×${ps.sku.dims_w}×${ps.sku.dims_h}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{ps.sku.weight_lbs ? `${ps.sku.weight_lbs} lbs` : '—'}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{ps.sku.units_per_pallet ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
