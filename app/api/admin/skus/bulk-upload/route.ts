import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(role: string) {
  return ['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes(role)
}

/**
 * POST /api/admin/skus/bulk-upload
 * Accepts a CSV file with columns:
 *   code, name, description, client_code, dims_l, dims_w, dims_h, weight_lbs, units_per_pallet, low_stock_threshold
 * Creates or updates SKUs. Returns { created, updated, skipped, errors }.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const text = await file.text()
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) return NextResponse.json({ error: 'File appears empty or has no data rows' }, { status: 400 })

    // Parse header row
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
    const getIdx = (name: string) => headers.indexOf(name)

    const codeIdx = getIdx('code')
    const nameIdx = getIdx('name')
    const descIdx = getIdx('description')
    const clientCodeIdx = getIdx('client_code')
    const lIdx = getIdx('dims_l')
    const wIdx = getIdx('dims_w')
    const hIdx = getIdx('dims_h')
    const weightIdx = getIdx('weight_lbs')
    const palletIdx = getIdx('units_per_pallet')
    const threshIdx = getIdx('low_stock_threshold')

    if (codeIdx === -1 || descIdx === -1 || clientCodeIdx === -1) {
      return NextResponse.json({ error: 'CSV must have columns: code, description, client_code' }, { status: 400 })
    }

    // Load all clients for lookup
    const clients = await prisma.client.findMany()
    const clientMap = new Map(clients.map(c => [c.code.toLowerCase(), c.id]))

    let created = 0, updated = 0, skipped = 0
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
      const code = cols[codeIdx]?.trim()
      const description = cols[descIdx]?.trim()
      const clientCode = cols[clientCodeIdx]?.trim().toLowerCase()

      if (!code || !description || !clientCode) {
        skipped++
        continue
      }

      const client_id = clientMap.get(clientCode)
      if (!client_id) {
        errors.push(`Row ${i + 1}: Unknown client code '${clientCode}'`)
        skipped++
        continue
      }

      const data = {
        name: cols[nameIdx]?.trim() || null,
        description,
        client_id,
        dims_l: cols[lIdx] ? parseFloat(cols[lIdx]) : null,
        dims_w: cols[wIdx] ? parseFloat(cols[wIdx]) : null,
        dims_h: cols[hIdx] ? parseFloat(cols[hIdx]) : null,
        weight_lbs: cols[weightIdx] ? parseFloat(cols[weightIdx]) : null,
        units_per_pallet: cols[palletIdx] ? parseInt(cols[palletIdx]) : null,
        low_stock_threshold: cols[threshIdx] ? parseInt(cols[threshIdx]) : null,
      }

      try {
        const existing = await prisma.sKU.findUnique({ where: { code } })
        if (existing) {
          await prisma.sKU.update({ where: { code }, data })
          updated++
        } else {
          await prisma.sKU.create({ data: { code, ...data } })
          created++
        }
      } catch (rowErr: any) {
        errors.push(`Row ${i + 1} (${code}): ${rowErr.message}`)
        skipped++
      }
    }

    return NextResponse.json({ created, updated, skipped, errors })
  } catch (err: any) {
    console.error('[POST /api/admin/skus/bulk-upload]', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
