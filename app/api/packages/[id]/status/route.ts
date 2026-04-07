import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any)?.role
  if (!['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes(role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Support both form submissions and JSON bodies
  let status: string | undefined
  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await req.formData().catch(() => null)
    status = formData ? (formData.get('status') as string) : undefined
  } else {
    const body = await req.json().catch(() => ({}))
    status = body.status
  }

  if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status. Must be APPROVED or REJECTED.' }, { status: 400 })
  }

  const packageId = parseInt(params.id)
  if (isNaN(packageId)) {
    return NextResponse.json({ error: 'Invalid package ID' }, { status: 400 })
  }

  const pkg = await prisma.package.update({
    where: { id: packageId },
    data: { status: status as 'APPROVED' | 'REJECTED' },
  })

  return NextResponse.json(pkg)
}
