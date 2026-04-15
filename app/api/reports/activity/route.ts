import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') ?? '30')
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const [asns, orders, receipts, transfers, returns] = await Promise.all([
    prisma.aSN.findMany({ where: { createdAt: { gte: since } }, include: { client: true, warehouse: true }, orderBy: { createdAt: 'desc' } }),
    prisma.order.findMany({ where: { createdAt: { gte: since } }, include: { client: true, warehouse: true }, orderBy: { createdAt: 'desc' } }),
    prisma.inboundReceipt.findMany({ where: { createdAt: { gte: since } }, include: { asn: { include: { client: true, warehouse: true } } }, orderBy: { createdAt: 'desc' } }),
    prisma.transferOrder.findMany({ where: { createdAt: { gte: since } }, include: { from_warehouse: true, to_warehouse: true }, orderBy: { createdAt: 'desc' } }),
    prisma.return.findMany({ where: { createdAt: { gte: since } }, include: { client: true, warehouse: true }, orderBy: { createdAt: 'desc' } }),
  ])
  return NextResponse.json({ asns, orders, receipts, transfers, returns, days })
}
