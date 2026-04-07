import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exportShipmentEDI214 } from '@/services/edi'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shipment = await prisma.shipment.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      order: {
        include: {
          warehouse: true,
          store: true,
          client: true,
          lines: { include: { sku: true } },
        },
      },
      pallets: {
        include: {
          pallet: {
            include: {
              items: { include: { sku: true } },
            },
          },
        },
      },
    },
  })

  if (!shipment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { content, filename } = exportShipmentEDI214({
    shipmentId: shipment.code,
    orderId: shipment.order.code,
    carrier: shipment.carrier ?? undefined,
    proNumber: shipment.pro_number ?? undefined,
    status: shipment.status,
    statusDate: shipment.shipped_at ?? new Date(),
    airportCode: shipment.order.store?.airport_code,
    shipperName: shipment.order.warehouse.stc_reference_name,
    shipperAddress: shipment.order.warehouse.address,
    shipperCity: shipment.order.warehouse.city,
    shipperState: shipment.order.warehouse.state,
    shipperZip: shipment.order.warehouse.zip,
    consigneeName: shipment.order.store
      ? `Kroger Store #${shipment.order.store.store_num}`
      : shipment.order.client.name,
    consigneeAddress: shipment.order.store?.address ?? '',
    consigneeCity: shipment.order.store?.city ?? '',
    consigneeState: shipment.order.store?.state ?? '',
    consigneeZip: shipment.order.store?.zip ?? '',
    items: shipment.order.lines.map(l => ({
      skuCode: l.sku.code,
      description: l.sku.description,
      qty: l.shipped,
      weight: l.sku.weight_lbs ? Number(l.sku.weight_lbs) * l.shipped : undefined,
    })),
  })

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'application/edi-x12',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
