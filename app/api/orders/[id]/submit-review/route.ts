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

  const order = await prisma.order.findUnique({ where: { id: parseInt(params.id) } })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (order.status !== 'DRAFT') {
    return NextResponse.json({ error: 'Only DRAFT orders can be submitted for review' }, { status: 400 })
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'PENDING_REVIEW', submitted_at: new Date() },
  })

  await prisma.auditLog.create({
    data: {
      entity: 'Order',
      entity_id: String(order.id),
      action: 'SUBMIT_FOR_REVIEW',
      user_id: userId ?? null,
      user_name: userName ?? null,
      details: JSON.stringify({ from: 'DRAFT', to: 'PENDING_REVIEW', code: order.code }),
    },
  })

  return NextResponse.json(updated)
}
