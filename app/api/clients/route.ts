import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/clients — simple list for dropdowns
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = (session.user as any)?.clientId

  const where: any = {}
  // CLIENT_USER roles can only see their own client
  if (clientId) where.id = clientId

  const clients = await prisma.client.findMany({
    where,
    select: { id: true, code: true, name: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(clients)
}
