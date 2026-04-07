import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/asns — list ASNs filtered by session
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const warehouseId = (session.user as any)?.warehouseId
  const clientId = (session.user as any)?.clientId

  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status')

  const where: any = {}
  if (warehouseId) where.warehouse_id = warehouseId
  if (clientId) where.client_id = clientId
  if (statusFilter) where.status = statusFilter

  const asns = await prisma.aSN.findMany({
    where,
    include: {
      client: true,
      warehouse: true,
      lines: { include: { sku: true } },
      receipts: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(asns)
}

// POST /api/asns — create a new ASN
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any)?.role
  const canCreate = ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR'].includes(role)
  if (!canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const { client_id, warehouse_id, expected_date, notes, lines } = body

    if (!client_id || !warehouse_id) {
      return NextResponse.json({ error: 'client_id and warehouse_id are required' }, { status: 400 })
    }

    if (!lines || lines.length === 0) {
      return NextResponse.json({ error: 'At least one line is required' }, { status: 400 })
    }

    // Generate ASN code: STC-ASN-{YEAR}-{zero-padded sequence}
    const year = new Date().getFullYear()
    const yearPrefix = `STC-ASN-${year}-`

    const countThisYear = await prisma.aSN.count({
      where: { code: { startsWith: yearPrefix } },
    })
    const sequence = countThisYear + 1
    const code = `${yearPrefix}${String(sequence).padStart(4, '0')}`

    const asn = await prisma.aSN.create({
      data: {
        code,
        client_id: parseInt(client_id),
        warehouse_id: parseInt(warehouse_id),
        expected_date: expected_date ? new Date(expected_date) : null,
        notes: notes || null,
        status: 'SCHEDULED',
        lines: {
          create: lines.map((l: any) => ({
            sku_id: parseInt(l.sku_id),
            expected_qty: parseInt(l.expected_qty),
          })),
        },
      },
      include: {
        client: true,
        warehouse: true,
        lines: { include: { sku: true } },
      },
    })

    return NextResponse.json(asn, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/asns]', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
