import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const discrepancies = await prisma.discrepancy.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(discrepancies)
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any)?.role
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR'].includes(role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await req.json()
  const { id, status, resolution } = body

  if (!id) {
    return NextResponse.json({ error: 'Missing discrepancy id' }, { status: 400 })
  }

  const validStatuses = ['OPEN', 'UNDER_REVIEW', 'RESOLVED']
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const discrepancy = await prisma.discrepancy.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(resolution !== undefined ? { resolution } : {}),
    },
  })

  return NextResponse.json(discrepancy)
}
