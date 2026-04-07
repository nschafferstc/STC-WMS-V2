import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/warehouses — filtered by session role/warehouse
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const warehouseId = (session.user as any)?.warehouseId
  const role = (session.user as any)?.role

  const where: any = {}
  // Warehouse-scoped users only see their own warehouse
  if (warehouseId && !['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR', 'STC_READ_ONLY'].includes(role)) {
    where.id = warehouseId
  }

  const warehouses = await prisma.warehouse.findMany({
    where,
    select: {
      id: true,
      code: true,
      stc_reference_name: true,
      company_name: true,
      city: true,
      state: true,
    },
    orderBy: { stc_reference_name: 'asc' },
  })

  return NextResponse.json(warehouses)
}
