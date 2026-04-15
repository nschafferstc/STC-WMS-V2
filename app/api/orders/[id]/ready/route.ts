import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendOrderReadyNotification } from '@/services/email'

// POST /api/orders/[id]/ready — mark order as READY, trigger notifications
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any)?.role
  const canUpdate = ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR', 'WAREHOUSE_OPS'].includes(role)
  if (!canUpdate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const orderId = parseInt(params.id)

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        warehouse: true,
        lines: { include: { sku: true } },
        pallets: true,
      },
    })

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    if (!['ALLOCATED', 'PARTIAL'].includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot mark order with status ${order.status} as READY` },
        { status: 400 }
      )
    }

    // Mark order as READY
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'READY' },
    })

    // Find alert rule recipients for ORDER_READY alerts (or fall back to warehouse/client users)
    const alertRules = await prisma.alertRule.findMany({
      where: { type: 'ORDER_READY', isActive: true },
    })

    const recipients: string[] = alertRules.flatMap(r => r.recipients)

    // Also add the client user emails as recipients
    const clientUsers = await prisma.user.findMany({
      where: { client_id: order.client_id, isActive: true },
      select: { email: true },
    })
    clientUsers.forEach(u => {
      if (!recipients.includes(u.email)) recipients.push(u.email)
    })

    // Send email notification (non-blocking — fire and forget in dev)
    if (recipients.length > 0) {
      sendOrderReadyNotification({
        orderId: String(order.id),
        orderCode: order.code,
        warehouse: order.warehouse.stc_reference_name,
        client: order.client.name,
        recipients,
      }).catch(e => console.error('[sendOrderReadyNotification]', e))
    }

    // Send email notification to STC staff
    try {
      const stcUsers = await prisma.user.findMany({
        where: { role: { in: ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR'] }, isActive: true },
        select: { email: true }
      })
      const stcRecipients = stcUsers.map(u => u.email)
      if (stcRecipients.length > 0) {
        const { sendOrderReadyNotification2 } = await import('@/services/email')
        await sendOrderReadyNotification2({
          orderCode: order.code,
          clientName: order.client.name,
          warehouseName: order.warehouse.stc_reference_name,
          palletCount: order.pallets?.length ?? 0,
          recipients: stcRecipients,
        })
      }
    } catch (e) {
      console.error('[Order Ready Email]', e)
    }

    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('[POST /api/orders/[id]/ready]', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
