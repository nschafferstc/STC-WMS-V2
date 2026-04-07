import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(role: string) {
  return ['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes(role)
}

interface Params { params: { id: string } }

// PATCH /api/admin/stores/[id] — update store airport_code override
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const storeId = parseInt(params.id)
  if (isNaN(storeId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  try {
    const body = await req.json()
    const { airport_code } = body

    if (!airport_code || typeof airport_code !== 'string') {
      return NextResponse.json({ error: 'airport_code is required' }, { status: 400 })
    }

    const code = airport_code.trim().toUpperCase()
    if (code.length !== 3) {
      return NextResponse.json({ error: 'Airport code must be exactly 3 characters' }, { status: 400 })
    }

    const store = await prisma.store.update({
      where: { id: storeId },
      data: { airport_code: code },
    })

    return NextResponse.json(store)
  } catch (err: any) {
    if (err.code === 'P2025') return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    console.error('[PATCH /api/admin/stores/[id]]', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
