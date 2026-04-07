import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/orders — list orders filtered by session
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any)?.role
  const warehouseId = (session.user as any)?.warehouseId
  const clientId = (session.user as any)?.clientId

  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status')
  const warehouseFilter = searchParams.get('warehouse_id')

  const where: any = {}
  if (warehouseId) where.warehouse_id = warehouseId
  if (clientId) where.client_id = clientId
  if (statusFilter) where.status = statusFilter
  if (warehouseFilter) where.warehouse_id = parseInt(warehouseFilter)

  const orders = await prisma.order.findMany({
    where,
    include: {
      client: true,
      warehouse: true,
      store: true,
      _count: { select: { lines: true, pallets: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(orders)
}

// POST /api/orders — create a new order
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any)?.role
  const canCreate = ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR'].includes(role)
  if (!canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const { client_id, warehouse_id, store_id, load_type, notes, lines } = body

    if (!client_id || !warehouse_id || !load_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!lines || lines.length === 0) {
      return NextResponse.json({ error: 'At least one order line is required' }, { status: 400 })
    }

    // Generate order code: STC-ORD-{YEAR}-{zero-padded sequence}
    const year = new Date().getFullYear()
    const yearPrefix = `STC-ORD-${year}-`

    // Count existing orders this year to get next sequence
    const countThisYear = await prisma.order.count({
      where: { code: { startsWith: yearPrefix } },
    })
    const sequence = countThisYear + 1
    const code = `${yearPrefix}${String(sequence).padStart(4, '0')}`

    const order = await prisma.order.create({
      data: {
        code,
        client_id: parseInt(client_id),
        warehouse_id: parseInt(warehouse_id),
        store_id: store_id ? parseInt(store_id) : null,
        load_type,
        notes: notes || null,
        status: 'DRAFT',
        lines: {
          create: lines.map((l: any) => ({
            sku_id: parseInt(l.sku_id),
            ordered_qty: parseInt(l.ordered_qty),
            allocated: 0,
            shipped: 0,
          })),
        },
      },
      include: {
        client: true,
        warehouse: true,
        lines: { include: { sku: true } },
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/orders]', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
