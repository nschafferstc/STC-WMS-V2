import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const warehouse_id = searchParams.get('warehouse_id')
  const client_id = searchParams.get('client_id')
  const where: any = {}
  if (warehouse_id) where.warehouse_id = parseInt(warehouse_id)
  if (client_id) where.sku = { client_id: parseInt(client_id) }
  const inventory = await prisma.inventory.findMany({
    where,
    include: { warehouse: true, sku: { include: { client: true } } },
    orderBy: [{ warehouse_id: 'asc' }, { sku_id: 'asc' }],
  })
  return NextResponse.json(inventory)
}
