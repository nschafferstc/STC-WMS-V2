import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const warehouseId = (session.user as any)?.warehouseId
  const where: any = {}
  if (warehouseId) where.warehouse_id = warehouseId

  const counts = await prisma.cycleCount.findMany({
    where,
    include: { warehouse: true, _count: { select: { lines: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(counts)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any)?.role
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR', 'WAREHOUSE_OPS'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { warehouse_id, notes, sku_ids } = body

    if (!warehouse_id) return NextResponse.json({ error: 'warehouse_id required' }, { status: 400 })

    const userName = (session.user as any)?.name ?? session.user?.email ?? 'Unknown'

    // Get current inventory for selected SKUs (or all if none specified)
    const inventoryWhere: any = { warehouse_id: parseInt(warehouse_id) }
    if (sku_ids && sku_ids.length > 0) {
      inventoryWhere.sku_id = { in: sku_ids.map((id: string) => parseInt(id)) }
    }

    const inventory = await prisma.inventory.findMany({
      where: inventoryWhere,
      include: { sku: true },
    })

    const code = `CC-${Date.now()}`

    const cycleCount = await prisma.cycleCount.create({
      data: {
        code,
        warehouse_id: parseInt(warehouse_id),
        counted_by: userName,
        notes: notes || null,
        lines: {
          create: inventory.map(inv => ({
            sku_id: inv.sku_id,
            system_qty: inv.on_hand,
          })),
        },
      },
      include: { lines: { include: { sku: true } }, warehouse: true },
    })

    return NextResponse.json(cycleCount, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
