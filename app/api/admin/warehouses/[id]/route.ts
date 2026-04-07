import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(role: string) {
  return ['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes(role)
}

interface Params { params: { id: string } }

// PATCH /api/admin/warehouses/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const warehouseId = parseInt(params.id)
  if (isNaN(warehouseId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  try {
    const body = await req.json()
    const { code, company_name, stc_reference_name, address, city, state, zip } = body

    const updateData: Record<string, any> = {}
    if (code !== undefined) updateData.code = code
    if (company_name !== undefined) updateData.company_name = company_name
    if (stc_reference_name !== undefined) updateData.stc_reference_name = stc_reference_name
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (zip !== undefined) updateData.zip = zip

    const warehouse = await prisma.warehouse.update({
      where: { id: warehouseId },
      data: updateData,
    })

    return NextResponse.json(warehouse)
  } catch (err: any) {
    if (err.code === 'P2025') return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    console.error('[PATCH /api/admin/warehouses/[id]]', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
