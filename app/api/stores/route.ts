import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/stores — optionally filtered by client_id or project_id
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const clientIdParam = searchParams.get('client_id')
  const projectIdParam = searchParams.get('project_id')
  const warehouseIdParam = searchParams.get('warehouse_id')

  const where: any = {}

  if (projectIdParam) {
    where.project_id = parseInt(projectIdParam)
  } else if (clientIdParam) {
    // Filter stores by client via project relation
    where.project = { client_id: parseInt(clientIdParam) }
  }

  if (warehouseIdParam) {
    where.assigned_warehouse_id = parseInt(warehouseIdParam)
  }

  const stores = await prisma.store.findMany({
    where,
    select: {
      id: true,
      store_num: true,
      subcode: true,
      region: true,
      region_code: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      assigned_warehouse_id: true,
      project_id: true,
      project: { select: { id: true, name: true, client_id: true } },
    },
    orderBy: [{ state: 'asc' }, { city: 'asc' }],
  })

  return NextResponse.json(stores)
}
