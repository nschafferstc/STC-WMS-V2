import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/orders/[id]/lines — replace all lines (edit order)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any)?.role
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { lines } = body
    // lines: [{ id?, sku_id, ordered_qty }]

    const orderId = parseInt(params.id)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { lines: true },
    })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (['COMPLETE', 'CANCELLED'].includes(order.status)) {
      return NextResponse.json({ error: 'Cannot edit a completed or cancelled order' }, { status: 400 })
    }

    // Delete existing lines and recreate
    await prisma.orderLine.deleteMany({ where: { order_id: orderId } })

    const created = await prisma.orderLine.createMany({
      data: lines.map((l: any) => ({
        order_id: orderId,
        sku_id: parseInt(l.sku_id),
        ordered_qty: parseInt(l.ordered_qty),
        allocated: 0,
        shipped: 0,
      })),
    })

    await prisma.auditLog.create({
      data: {
        user_name: (session.user as any)?.name ?? session.user?.email ?? 'Unknown',
        action: 'EDIT',
        entity: 'Order',
        entity_id: String(orderId),
        details: `Updated order lines (${lines.length} lines)`,
      },
    })

    return NextResponse.json({ count: created.count })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
