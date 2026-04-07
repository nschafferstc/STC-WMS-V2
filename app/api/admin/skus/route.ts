import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(role: string) {
  return ['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes(role)
}

// POST /api/admin/skus — create a single SKU
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { code, name, description, client_id, dims_l, dims_w, dims_h, weight_lbs, units_per_pallet, low_stock_threshold } = body

    if (!code || !description || !client_id) {
      return NextResponse.json({ error: 'code, description, and client_id are required' }, { status: 400 })
    }

    const sku = await prisma.sKU.create({
      data: {
        code: String(code).trim(),
        name: name || null,
        description,
        client_id: parseInt(client_id),
        dims_l: dims_l != null ? parseFloat(dims_l) : null,
        dims_w: dims_w != null ? parseFloat(dims_w) : null,
        dims_h: dims_h != null ? parseFloat(dims_h) : null,
        weight_lbs: weight_lbs != null ? parseFloat(weight_lbs) : null,
        units_per_pallet: units_per_pallet != null ? parseInt(units_per_pallet) : null,
        low_stock_threshold: low_stock_threshold != null ? parseInt(low_stock_threshold) : null,
      },
      include: { client: true },
    })

    return NextResponse.json(sku, { status: 201 })
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'A SKU with that code already exists' }, { status: 409 })
    console.error('[POST /api/admin/skus]', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
