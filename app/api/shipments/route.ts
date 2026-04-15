import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const warehouseId = (session.user as any)?.warehouseId
  const shipments = await prisma.shipment.findMany({
    where: warehouseId ? { order: { warehouse_id: warehouseId } } : undefined,
    include: { order: { include: { client: true, warehouse: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(shipments)
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
    const { order_id, carrier, pro_number, tracking, notes } = body

    if (!order_id) return NextResponse.json({ error: 'order_id required' }, { status: 400 })

    const order = await prisma.order.findUnique({
      where: { id: parseInt(order_id) },
      include: { lines: true },
    })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const code = `SHP-${Date.now()}`

    const shipment = await prisma.shipment.create({
      data: {
        code,
        order_id: parseInt(order_id),
        carrier: carrier || null,
        pro_number: pro_number || null,
        tracking: tracking || null,
        shipped_at: new Date(),
      },
    })

    // Mark order as COMPLETE and update shipped quantities
    for (const line of order.lines) {
      await prisma.orderLine.update({
        where: { id: line.id },
        data: { shipped: line.ordered_qty },
      })
      // Decrement on-hand inventory
      await prisma.inventory.updateMany({
        where: { sku_id: line.sku_id, warehouse_id: order.warehouse_id },
        data: {
          on_hand: { decrement: line.ordered_qty },
          allocated: { decrement: line.allocated },
        },
      })
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'COMPLETE' },
    })

    await prisma.auditLog.create({
      data: {
        user_name: (session.user as any)?.name ?? session.user?.email ?? 'Unknown',
        action: 'CREATE',
        entity: 'Shipment',
        entity_id: String(shipment.id),
        details: `Created shipment ${code} for order ${order.code} via ${carrier ?? 'unknown carrier'}`,
      },
    })

    return NextResponse.json(shipment, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
