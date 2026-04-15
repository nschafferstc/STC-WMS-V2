import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userId = (session?.user as any)?.id
  const userName = (session?.user as any)?.name ?? session?.user?.email

  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes(role)) {
    return NextResponse.json({ error: 'Only managers can approve orders' }, { status: 403 })
  }

  const { reject, reason } = await req.json().catch(() => ({ reject: false, reason: '' }))

  const order = await prisma.order.findUnique({ where: { id: parseInt(params.id) } })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (order.status !== 'PENDING_REVIEW') {
    return NextResponse.json({ error: 'Order is not pending review' }, { status: 400 })
  }

  if (reject) {
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'DRAFT',
        notes: reason ? `[Rejected: ${reason}]${order.notes ? '\n' + order.notes : ''}` : order.notes,
      },
    })
    await prisma.auditLog.create({
      data: {
        entity: 'Order',
        entity_id: String(order.id),
        action: 'REJECT',
        user_id: userId ?? null,
        user_name: userName ?? null,
        details: JSON.stringify({ from: 'PENDING_REVIEW', to: 'DRAFT', reason, code: order.code }),
      },
    })
    return NextResponse.json(updated)
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'APPROVED', approved_at: new Date() },
  })

  await prisma.auditLog.create({
    data: {
      entity: 'Order',
      entity_id: String(order.id),
      action: 'APPROVE',
      user_id: userId ?? null,
      user_name: userName ?? null,
      details: JSON.stringify({ from: 'PENDING_REVIEW', to: 'APPROVED', code: order.code }),
    },
  })

  return NextResponse.json(updated)
}
