import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const disc = await prisma.discrepancy.findUnique({ where: { id: parseInt(params.id) } })
  if (!disc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(disc)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any)?.role
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR', 'WAREHOUSE_OPS'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { status, resolution } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (resolution !== undefined) updateData.resolution = resolution

    const updated = await prisma.discrepancy.update({
      where: { id: parseInt(params.id) },
      data: updateData,
    })

    await prisma.auditLog.create({
      data: {
        user_name: (session.user as any)?.name ?? session.user?.email ?? 'Unknown',
        action: 'UPDATE',
        entity: 'Discrepancy',
        entity_id: String(params.id),
        details: `Status changed to ${status}${resolution ? ` — ${resolution}` : ''}`,
      },
    })

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
