import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/orders/[id]/pallets
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pallets = await prisma.pallet.findMany({
    where: { order_id: parseInt(params.id) },
    include: { items: { include: { sku: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(pallets)
}

// POST /api/orders/[id]/pallets — add a pallet to an order
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any)?.role
  const canEdit = ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR', 'WAREHOUSE_OPS'].includes(role)
  if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const orderId = parseInt(params.id)

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, warehouse_id: true, status: true, code: true },
    })

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    if (['READY', 'COMPLETE', 'CANCELLED'].includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot add pallets to order with status ${order.status}` },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { length, width, height, weight_lbs, shrink_wrapped } = body

    // Generate pallet code: PLT-{ORDER_CODE}-{sequence}
    const palletCount = await prisma.pallet.count({ where: { order_id: orderId } })
    const palletCode = `PLT-${order.code}-${String(palletCount + 1).padStart(3, '0')}`

    const pallet = await prisma.pallet.create({
      data: {
        code: palletCode,
        warehouse_id: order.warehouse_id,
        order_id: orderId,
        length: length ?? null,
        width: width ?? null,
        height: height ?? null,
        weight_lbs: weight_lbs ?? null,
        shrink_wrapped: shrink_wrapped ?? false,
      },
      include: { items: { include: { sku: true } } },
    })

    return NextResponse.json(pallet, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/orders/[id]/pallets]', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
