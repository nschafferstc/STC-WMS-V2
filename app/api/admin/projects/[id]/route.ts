import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(role: string) {
  return ['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes(role)
}

interface Params { params: { id: string } }

// PATCH /api/admin/projects/[id] — update project fields including dim_factor_override
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const projectId = parseInt(params.id)
  if (isNaN(projectId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  try {
    const body = await req.json()
    const { name, isRollout, aging_threshold_days, dim_factor_override } = body

    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (isRollout !== undefined) updateData.isRollout = Boolean(isRollout)
    if (aging_threshold_days !== undefined) updateData.aging_threshold_days = parseInt(aging_threshold_days)
    if ('dim_factor_override' in body) {
      updateData.dim_factor_override = dim_factor_override !== null && dim_factor_override !== ''
        ? parseFloat(dim_factor_override)
        : null
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: { client: true },
    })

    return NextResponse.json(project)
  } catch (err: any) {
    if (err.code === 'P2025') return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    console.error('[PATCH /api/admin/projects/[id]]', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
