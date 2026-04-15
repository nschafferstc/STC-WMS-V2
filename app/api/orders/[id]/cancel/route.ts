import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any)?.role
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const order = await prisma.order.findUnique({ where: { id: parseInt(params.id) } })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (['COMPLETE', 'CANCELLED'].includes(order.status)) {
      return NextResponse.json({ error: 'Cannot cancel a completed or already cancelled order' }, { status: 400 })
    }

    // Release any allocated inventory back
    const lines = await prisma.orderLine.findMany({ where: { order_id: order.id } })
    for (const line of lines) {
      if (line.allocated > 0) {
        await prisma.inventory.updateMany({
          where: { sku_id: line.sku_id, warehouse_id: order.warehouse_id },
          data: { allocated: { decrement: line.allocated } },
        })
      }
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
    })

    await prisma.auditLog.create({
      data: {
        user_name: (session.user as any)?.name ?? session.user?.email ?? 'Unknown',
        action: 'CANCEL',
        entity: 'Order',
        entity_id: String(order.id),
        details: `Cancelled order ${order.code}`,
      },
    })

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
