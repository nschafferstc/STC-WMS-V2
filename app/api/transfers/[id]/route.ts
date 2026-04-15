import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const transfer = await prisma.transferOrder.findUnique({
    where: { id: parseInt(params.id) },
    include: { from_warehouse: true, to_warehouse: true, lines: { include: { sku: true } } },
  })
  if (!transfer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(transfer)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { status, notes } = body
  const data: any = { notes }
  if (status) {
    data.status = status
    if (status === 'CONFIRMED') data.confirmed_at = new Date()
    if (status === 'RECEIVED') data.received_at = new Date()
  }
  const transfer = await prisma.transferOrder.update({
    where: { id: parseInt(params.id) },
    data,
    include: { from_warehouse: true, to_warehouse: true, lines: { include: { sku: true } } },
  })
  return NextResponse.json(transfer)
}
