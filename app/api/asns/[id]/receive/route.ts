import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/asns/[id]/receive — record inbound receipt lines and update inventory
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any)?.role
  const canReceive = ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR', 'WAREHOUSE_OPS'].includes(role)
  if (!canReceive) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const asnId = parseInt(params.id)
    const body = await req.json()
    const { lines } = body

    if (!lines || lines.length === 0) {
      return NextResponse.json({ error: 'Receipt lines are required' }, { status: 400 })
    }

    // Load the ASN to validate state and get warehouse_id
    const asn = await prisma.aSN.findUnique({
      where: { id: asnId },
      include: { warehouse: true, client: true },
    })

    if (!asn) return NextResponse.json({ error: 'ASN not found' }, { status: 404 })

    if (['RECEIVED', 'CANCELLED'].includes(asn.status)) {
      return NextResponse.json(
        { error: `Cannot receive against ASN with status ${asn.status}` },
        { status: 400 }
      )
    }

    const hasDiscrepancies = lines.some(
      (l: any) => l.received_qty !== l.expected_qty || l.discrepancy_type
    )

    // Create receipt and lines in a transaction, then update inventory
    const result = await prisma.$transaction(async tx => {
      // Create the inbound receipt
      const receipt = await tx.inboundReceipt.create({
        data: {
          asn_id: asnId,
          status: hasDiscrepancies ? 'DISCREPANCY' : 'COMPLETE',
          received_at: new Date(),
          lines: {
            create: lines.map((l: any) => ({
              sku_id: l.sku_id,
              expected_qty: l.expected_qty,
              received_qty: l.received_qty,
              discrepancy_type: l.discrepancy_type || null,
              notes: l.notes || null,
            })),
          },
        },
        include: { lines: { include: { sku: true } } },
      })

      // Update inventory for each received line
      for (const line of lines) {
        const receivedQty = parseInt(line.received_qty) || 0
        if (receivedQty <= 0) continue

        // Upsert inventory record
        await tx.inventory.upsert({
          where: {
            warehouse_id_sku_id: {
              warehouse_id: asn.warehouse_id,
              sku_id: line.sku_id,
            },
          },
          update: {
            on_hand: { increment: receivedQty },
          },
          create: {
            warehouse_id: asn.warehouse_id,
            sku_id: line.sku_id,
            on_hand: receivedQty,
            allocated: 0,
          },
        })

        // Create inventory lot record
        await tx.inventoryLot.create({
          data: {
            sku_id: line.sku_id,
            warehouse_id: asn.warehouse_id,
            qty: receivedQty,
            received_date: new Date(),
          },
        })

        // If there's a discrepancy, create a Discrepancy record
        if (line.discrepancy_type && line.received_qty !== line.expected_qty) {
          await tx.discrepancy.create({
            data: {
              type: line.discrepancy_type,
              source_ref: receipt.code,
              description: `ASN ${asn.code}: SKU ${line.sku_code} — Expected ${line.expected_qty}, Received ${line.received_qty}. Type: ${line.discrepancy_type}.${line.notes ? ` Notes: ${line.notes}` : ''}`,
              status: 'OPEN',
            },
          })
        }
      }

      // Update ASN status: if all lines fully received → RECEIVED, else keep IN_TRANSIT
      const totalExpected = lines.reduce((s: number, l: any) => s + l.expected_qty, 0)
      const totalReceived = lines.reduce((s: number, l: any) => s + (l.received_qty || 0), 0)

      let newAsnStatus: 'RECEIVED' | 'IN_TRANSIT' = 'IN_TRANSIT'
      if (totalReceived >= totalExpected) {
        newAsnStatus = 'RECEIVED'
      }

      await tx.aSN.update({
        where: { id: asnId },
        data: { status: newAsnStatus },
      })

      return receipt
    })

    return NextResponse.json(result, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/asns/[id]/receive]', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
