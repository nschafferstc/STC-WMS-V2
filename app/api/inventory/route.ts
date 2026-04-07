import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const warehouseId = (session.user as any)?.warehouseId
  const { searchParams } = new URL(req.url)
  const warehouseFilter = searchParams.get('warehouse_id')

  const where: any = {}
  if (warehouseId) where.warehouse_id = warehouseId
  if (warehouseFilter) where.warehouse_id = parseInt(warehouseFilter)

  const inventory = await prisma.inventory.findMany({
    where,
    include: {
      sku: { include: { client: true } },
      warehouse: true,
    },
    orderBy: [{ warehouse: { code: 'asc' } }, { sku: { code: 'asc' } }],
  })

  return NextResponse.json(
    inventory.map(inv => ({
      ...inv,
      available: inv.on_hand - inv.allocated,
    }))
  )
}
