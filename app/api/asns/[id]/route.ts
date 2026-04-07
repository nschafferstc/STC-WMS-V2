import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/asns/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const asn = await prisma.aSN.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      client: true,
      warehouse: true,
      lines: { include: { sku: true } },
      receipts: {
        include: { lines: { include: { sku: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!asn) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(asn)
}

// PATCH /api/asns/[id] — update status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any)?.role
  const canEdit = ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR', 'WAREHOUSE_OPS'].includes(role)
  if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const { status, notes } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes

    const asn = await prisma.aSN.update({
      where: { id: parseInt(params.id) },
      data: updateData,
    })

    return NextResponse.json(asn)
  } catch (err: any) {
    console.error('[PATCH /api/asns/[id]]', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
