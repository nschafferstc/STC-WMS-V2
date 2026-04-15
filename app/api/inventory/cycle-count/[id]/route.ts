import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cc = await prisma.cycleCount.findUnique({
    where: { id: parseInt(params.id) },
    include: { warehouse: true, lines: { include: { sku: true } } },
  })
  if (!cc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(cc)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any)?.role
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR', 'WAREHOUSE_OPS'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { lines, complete, notes } = body
    // lines: [{ id, counted_qty, notes }]

    const ccId = parseInt(params.id)
    const cc = await prisma.cycleCount.findUnique({ where: { id: ccId }, include: { lines: true } })
    if (!cc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (cc.status === 'COMPLETE') return NextResponse.json({ error: 'Already completed' }, { status: 400 })

    // Update each counted line
    if (lines && Array.isArray(lines)) {
      for (const line of lines) {
        const variance = line.counted_qty !== null && line.counted_qty !== undefined
          ? line.counted_qty - (cc.lines.find(l => l.id === line.id)?.system_qty ?? 0)
          : null
        await prisma.cycleCountLine.update({
          where: { id: line.id },
          data: {
            counted_qty: line.counted_qty ?? null,
            variance,
            notes: line.notes ?? null,
          },
        })
      }
    }

    if (complete) {
      // Auto-create inventory adjustments for variances
      const userName = (session.user as any)?.name ?? session.user?.email ?? 'Unknown'
      const updatedLines = await prisma.cycleCountLine.findMany({ where: { count_id: ccId } })

      for (const line of updatedLines) {
        if (line.variance !== null && line.variance !== 0) {
          await prisma.inventory.updateMany({
            where: { sku_id: line.sku_id, warehouse_id: cc.warehouse_id },
            data: { on_hand: { increment: line.variance } },
          })
          await prisma.inventoryAdjustment.create({
            data: {
              warehouse_id: cc.warehouse_id,
              sku_id: line.sku_id,
              quantity: line.variance,
              reason: 'CYCLE_COUNT',
              notes: `Cycle count ${cc.code}`,
              adjusted_by: userName,
            },
          })
        }
      }

      await prisma.cycleCount.update({
        where: { id: ccId },
        data: { status: 'COMPLETE', completed_at: new Date(), notes: notes ?? cc.notes },
      })
    } else if (notes !== undefined) {
      await prisma.cycleCount.update({ where: { id: ccId }, data: { notes } })
    }

    const updated = await prisma.cycleCount.findUnique({
      where: { id: ccId },
      include: { warehouse: true, lines: { include: { sku: true } } },
    })

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
