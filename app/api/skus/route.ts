import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/skus — optionally filtered by client_id
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const clientIdParam = searchParams.get('client_id')
  const sessionClientId = (session.user as any)?.clientId

  const where: any = {}

  if (clientIdParam) {
    where.client_id = parseInt(clientIdParam)
  } else if (sessionClientId) {
    // Client-scoped users only see their own SKUs
    where.client_id = sessionClientId
  }

  const skus = await prisma.sKU.findMany({
    where,
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      client_id: true,
      units_per_pallet: true,
      weight_lbs: true,
    },
    orderBy: { code: 'asc' },
  })

  return NextResponse.json(skus)
}
