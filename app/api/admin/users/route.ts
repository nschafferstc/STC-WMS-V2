import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(role: string) {
  return ['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes(role)
}

// GET /api/admin/users — list all users
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    include: { warehouse: true, client: true },
    orderBy: { name: 'asc' },
  })

  // Never return passwordHash
  return NextResponse.json(users.map(({ passwordHash, ...u }) => u))
}

// POST /api/admin/users — create a new user
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { name, email, password, role, warehouse_id, client_id, isActive } = body

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'name, email, and role are required' }, { status: 400 })
    }

    // Check for existing email
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 })
    }

    let passwordHash: string | null = null
    if (password) {
      // In production use bcrypt; for now store as-is in dev
      if (process.env.NODE_ENV === 'production') {
        const bcrypt = await import('bcryptjs')
        passwordHash = await bcrypt.hash(password, 12)
      } else {
        passwordHash = password
      }
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        warehouse_id: warehouse_id ?? null,
        client_id: client_id ?? null,
        isActive: isActive ?? true,
      },
      include: { warehouse: true, client: true },
    })

    const { passwordHash: _ph, ...safeUser } = user
    return NextResponse.json(safeUser, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/admin/users]', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
