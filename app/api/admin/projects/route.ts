import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(role: string) {
  return ['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes(role)
}

// POST /api/admin/projects — create a new project
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { code, name, client_id, isRollout, aging_threshold_days, dim_factor_override } = body

    if (!code || !name || !client_id) {
      return NextResponse.json({ error: 'code, name, and client_id are required' }, { status: 400 })
    }

    const project = await prisma.project.create({
      data: {
        code: String(code).toUpperCase(),
        name,
        client_id: parseInt(client_id),
        isRollout: Boolean(isRollout),
        aging_threshold_days: aging_threshold_days ? parseInt(aging_threshold_days) : 90,
        dim_factor_override: dim_factor_override ? parseFloat(dim_factor_override) : null,
      },
      include: { client: true },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'A project with that code already exists' }, { status: 409 })
    console.error('[POST /api/admin/projects]', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
