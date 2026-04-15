import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userId = (session?.user as any)?.id
  const userName = (session?.user as any)?.name ?? session?.user?.email

  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR', 'WAREHOUSE_OPS'].includes(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const order = await prisma.order.findUnique({
    where: { id: parseInt(params.id) },
    include: { warehouse: true },
  })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (order.status !== 'SENT_TO_WAREHOUSE') {
    return NextResponse.json({ error: 'Order must be in SENT_TO_WAREHOUSE status to confirm' }, { status: 400 })
  }

  // Warehouse-scoped users can only confirm orders for their warehouse
  const warehouseId = (session?.user as any)?.warehouseId
  if (warehouseId && order.warehouse_id !== warehouseId) {
    return NextResponse.json({ error: 'You can only confirm orders for your warehouse' }, { status: 403 })
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'WAREHOUSE_CONFIRMED', warehouse_confirmed_at: new Date() },
  })

  await prisma.auditLog.create({
    data: {
      entity: 'Order',
      entity_id: String(order.id),
      action: 'WAREHOUSE_CONFIRM',
      user_id: userId ?? null,
      user_name: userName ?? null,
      details: JSON.stringify({
        from: 'SENT_TO_WAREHOUSE',
        to: 'WAREHOUSE_CONFIRMED',
        code: order.code,
        warehouse: order.warehouse.stc_reference_name,
      }),
    },
  })

  return NextResponse.json(updated)
}
