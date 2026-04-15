import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const warehouseId = searchParams.get('warehouse_id')
  const warehouseIdSession = (session.user as any)?.warehouseId

  const where: any = {}
  if (warehouseIdSession) where.warehouse_id = warehouseIdSession
  if (warehouseId) where.warehouse_id = parseInt(warehouseId)

  const adjustments = await prisma.inventoryAdjustment.findMany({
    where,
    include: { sku: true, warehouse: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json(adjustments)
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
    const { sku_id, warehouse_id, quantity, reason, notes } = body

    if (!sku_id || !warehouse_id || quantity === undefined || !reason) {
      return NextResponse.json({ error: 'sku_id, warehouse_id, quantity, and reason are required' }, { status: 400 })
    }

    const userName = (session.user as any)?.name ?? session.user?.email ?? 'Unknown'

    // Upsert inventory record and apply adjustment
    const existing = await prisma.inventory.findUnique({
      where: { warehouse_id_sku_id: { warehouse_id: parseInt(warehouse_id), sku_id: parseInt(sku_id) } },
    })

    if (!existing) {
      // Create new inventory record if it doesn't exist
      if (quantity < 0) {
        return NextResponse.json({ error: 'Cannot remove stock from an item with no inventory record' }, { status: 400 })
      }
      await prisma.inventory.create({
        data: { warehouse_id: parseInt(warehouse_id), sku_id: parseInt(sku_id), on_hand: quantity, allocated: 0 },
      })
    } else {
      const newOnHand = existing.on_hand + parseInt(quantity)
      if (newOnHand < 0) {
        return NextResponse.json({ error: `Adjustment would result in negative stock (current: ${existing.on_hand})` }, { status: 400 })
      }
      await prisma.inventory.update({
        where: { warehouse_id_sku_id: { warehouse_id: parseInt(warehouse_id), sku_id: parseInt(sku_id) } },
        data: { on_hand: { increment: parseInt(quantity) } },
      })
    }

    const adjustment = await prisma.inventoryAdjustment.create({
      data: {
        warehouse_id: parseInt(warehouse_id),
        sku_id: parseInt(sku_id),
        quantity: parseInt(quantity),
        reason,
        notes: notes || null,
        adjusted_by: userName,
      },
    })

    await prisma.auditLog.create({
      data: {
        user_name: userName,
        action: 'ADJUST',
        entity: 'Inventory',
        entity_id: String(sku_id),
        details: `Qty ${quantity > 0 ? '+' : ''}${quantity} — ${reason}`,
      },
    })

    return NextResponse.json(adjustment)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
