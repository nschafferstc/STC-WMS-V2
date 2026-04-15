import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ret = await prisma.return.findUnique({
    where: { id: parseInt(params.id) },
    include: { warehouse: true, client: true, lines: { include: { sku: true } } },
  })
  if (!ret) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(ret)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { status, notes } = body
  const data: any = {}
  if (status) data.status = status
  if (notes !== undefined) data.notes = notes
  if (status === 'RECEIVED') data.received_at = new Date()
  const ret = await prisma.return.update({
    where: { id: parseInt(params.id) },
    data,
    include: { warehouse: true, client: true, lines: { include: { sku: true } } },
  })
  return NextResponse.json(ret)
}
