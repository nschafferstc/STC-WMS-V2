import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(role: string) {
  return ['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes(role)
}

interface Params { params: { id: string } }

// PATCH /api/admin/clients/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const clientId = parseInt(params.id)
  if (isNaN(clientId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  try {
    const { name } = await req.json()
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const client = await prisma.client.update({
      where: { id: clientId },
      data: { name },
    })

    return NextResponse.json(client)
  } catch (err: any) {
    if (err.code === 'P2025') return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    console.error('[PATCH /api/admin/clients/[id]]', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
