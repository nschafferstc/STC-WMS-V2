import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const returns = await prisma.return.findMany({
    include: { warehouse: true, client: true, lines: { include: { sku: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(returns)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { warehouse_id, client_id, return_type, notes, lines } = body
  if (!warehouse_id || !client_id || !lines?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const code = `RET-${Date.now()}`
  const ret = await prisma.return.create({
    data: {
      code,
      warehouse_id: parseInt(warehouse_id),
      client_id: parseInt(client_id),
      return_type: return_type || 'JOB_SITE',
      notes,
      lines: {
        create: lines.map((l: any) => ({
          sku_id: parseInt(l.sku_id),
          qty: parseInt(l.qty),
          condition: l.condition || 'GOOD',
          notes: l.notes,
        })),
      },
    },
    include: { warehouse: true, client: true, lines: { include: { sku: true } } },
  })
  return NextResponse.json(ret, { status: 201 })
}
