import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userId = (session?.user as any)?.id
  const userName = (session?.user as any)?.name ?? session?.user?.email

  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR'].includes(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const order = await prisma.order.findUnique({
    where: { id: parseInt(params.id) },
    include: { warehouse: true, client: true },
  })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (order.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Order must be APPROVED before sending to warehouse' }, { status: 400 })
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'SENT_TO_WAREHOUSE', sent_to_warehouse_at: new Date() },
  })

  await prisma.auditLog.create({
    data: {
      entity: 'Order',
      entity_id: String(order.id),
      action: 'SEND_TO_WAREHOUSE',
      user_id: userId ?? null,
      user_name: userName ?? null,
      details: JSON.stringify({
        from: 'APPROVED',
        to: 'SENT_TO_WAREHOUSE',
        code: order.code,
        warehouse: order.warehouse.stc_reference_name,
      }),
    },
  })

  return NextResponse.json(updated)
}
