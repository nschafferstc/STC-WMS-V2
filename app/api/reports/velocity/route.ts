import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') ?? '30')
  const warehouseId = searchParams.get('warehouse_id')
  const warehouseIdSession = (session.user as any)?.warehouseId

  const since = new Date()
  since.setDate(since.getDate() - days)

  const warehouseFilter = warehouseIdSession ?? (warehouseId ? parseInt(warehouseId) : undefined)

  // Get all order lines from shipped orders in the period
  const orderLines = await prisma.orderLine.findMany({
    where: {
      order: {
        status: 'COMPLETE',
        updatedAt: { gte: since },
        ...(warehouseFilter ? { warehouse_id: warehouseFilter } : {}),
      },
    },
    include: {
      sku: { include: { client: true } },
      order: { include: { warehouse: true } },
    },
  })

  // Aggregate by SKU
  const skuMap: Record<number, {
    sku_code: string
    sku_description: string
    client: string
    warehouse: string
    units_shipped: number
    order_count: number
  }> = {}

  for (const line of orderLines) {
    if (!skuMap[line.sku_id]) {
      skuMap[line.sku_id] = {
        sku_code: line.sku.code,
        sku_description: line.sku.description,
        client: line.sku.client.name,
        warehouse: line.order.warehouse.stc_reference_name,
        units_shipped: 0,
        order_count: 0,
      }
    }
    skuMap[line.sku_id].units_shipped += line.shipped
    skuMap[line.sku_id].order_count += 1
  }

  const result = Object.entries(skuMap)
    .map(([sku_id, data]) => ({
      sku_id: parseInt(sku_id),
      ...data,
      units_per_day: Math.round((data.units_shipped / days) * 10) / 10,
      velocity_label: data.units_shipped === 0 ? 'Dead'
        : data.units_shipped < 10 ? 'Slow'
        : data.units_shipped < 50 ? 'Moderate'
        : 'Fast',
    }))
    .sort((a, b) => b.units_shipped - a.units_shipped)

  return NextResponse.json({ days, since, items: result })
}
