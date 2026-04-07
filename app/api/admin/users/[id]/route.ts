import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(role: string) {
  return ['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes(role)
}

interface Params { params: { id: string } }

// GET /api/admin/users/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const userId = parseInt(params.id)
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { warehouse: true, client: true },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { passwordHash, ...safeUser } = user
  return NextResponse.json(safeUser)
}

// PATCH /api/admin/users/[id] — update user
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const userId = parseInt(params.id)
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  try {
    const body = await req.json()
    const { name, email, password, role, warehouse_id, client_id, isActive } = body

    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role
    if (warehouse_id !== undefined) updateData.warehouse_id = warehouse_id
    if (client_id !== undefined) updateData.client_id = client_id
    if (isActive !== undefined) updateData.isActive = isActive

    if (password) {
      if (process.env.NODE_ENV === 'production') {
        const bcrypt = await import('bcryptjs')
        updateData.passwordHash = await bcrypt.hash(password, 12)
      } else {
        updateData.passwordHash = password
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { warehouse: true, client: true },
    })

    const { passwordHash, ...safeUser } = user
    return NextResponse.json(safeUser)
  } catch (err: any) {
    if (err.code === 'P2025') return NextResponse.json({ error: 'User not found' }, { status: 404 })
    console.error('[PATCH /api/admin/users/[id]]', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id] — deactivate user (soft delete)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const userId = parseInt(params.id)
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  // Prevent self-deactivation
  const currentUserId = parseInt((session.user as any)?.id ?? '0')
  if (userId === currentUserId) {
    return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 })
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    })
    const { passwordHash, ...safeUser } = user
    return NextResponse.json(safeUser)
  } catch (err: any) {
    if (err.code === 'P2025') return NextResponse.json({ error: 'User not found' }, { status: 404 })
    console.error('[DELETE /api/admin/users/[id]]', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
