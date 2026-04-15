import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const transfers = await prisma.transferOrder.findMany({
    include: { from_warehouse: true, to_warehouse: true, lines: { include: { sku: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(transfers)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { from_warehouse_id, to_warehouse_id, notes, lines } = body
  if (!from_warehouse_id || !to_warehouse_id || !lines?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const code = `TRF-${Date.now()}`
  const transfer = await prisma.transferOrder.create({
    data: {
      code,
      from_warehouse_id: parseInt(from_warehouse_id),
      to_warehouse_id: parseInt(to_warehouse_id),
      notes,
      lines: {
        create: lines.map((l: any) => ({
          sku_id: parseInt(l.sku_id),
          qty_requested: parseInt(l.qty_requested),
        })),
      },
    },
    include: { from_warehouse: true, to_warehouse: true, lines: { include: { sku: true } } },
  })
  return NextResponse.json(transfer, { status: 201 })
}
