import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const warehouseId = searchParams.get('warehouse_id')
  const clientId = searchParams.get('client_id')
  const warehouseIdSession = (session.user as any)?.warehouseId

  const where: any = {}
  if (warehouseIdSession) where.warehouse_id = warehouseIdSession
  if (warehouseId) where.warehouse_id = parseInt(warehouseId)
  if (clientId) where.sku = { client_id: parseInt(clientId) }

  const lots = await prisma.inventoryLot.findMany({
    where,
    include: { sku: { include: { client: true } }, warehouse: true },
    orderBy: { received_date: 'asc' },
  })

  const now = new Date()
  const result = lots.map(lot => {
    const daysSinceReceived = Math.floor((now.getTime() - lot.received_date.getTime()) / (1000 * 60 * 60 * 24))
    return {
      id: lot.id,
      sku_code: lot.sku.code,
      sku_description: lot.sku.description,
      client: lot.sku.client.name,
      warehouse: lot.warehouse.stc_reference_name,
      qty: lot.qty,
      received_date: lot.received_date,
      days_on_hand: daysSinceReceived,
      aging_bucket: daysSinceReceived <= 30 ? '0-30 days'
        : daysSinceReceived <= 60 ? '31-60 days'
        : daysSinceReceived <= 90 ? '61-90 days'
        : '90+ days',
    }
  })

  return NextResponse.json(result)
}
