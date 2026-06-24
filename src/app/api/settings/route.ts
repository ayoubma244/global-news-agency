/**
 * /api/settings - site settings
 * GET  - get all
 * PUT  - bulk update
 */
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentAdmin } from '@/lib/auth'
import { getDefaultSettings } from '@/lib/settings'

const prisma = new PrismaClient()

export async function GET() {
  const [rows, defaults] = await Promise.all([
    prisma.setting.findMany(),
    getDefaultSettings(),
  ])

  const map: Record<string, any> = {}
  for (const d of defaults) {
    const row = rows.find(r => r.key === d.key)
    map[d.key] = {
      value: row?.value ?? d.value,
      type: d.type,
      group: d.group,
      label: d.label,
    }
  }
  // Include any extra keys not in defaults
  for (const r of rows) {
    if (!map[r.key]) {
      map[r.key] = { value: r.value, type: r.type, group: r.group, label: r.label }
    }
  }
  return NextResponse.json({ ok: true, settings: map })
}

export async function PUT(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const body = await req.json() // { settings: { key: value, ... } }
  const updates = body.settings || body

  const defaults = await getDefaultSettings()
  const defaultMap: Record<string, any> = {}
  for (const d of defaults) defaultMap[d.key] = d

  for (const [key, value] of Object.entries(updates)) {
    const def = defaultMap[key]
    await prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: {
        key,
        value: String(value),
        type: def?.type || 'text',
        group: def?.group || 'general',
        label: def?.label,
      },
    })
  }

  return NextResponse.json({ ok: true, updated: Object.keys(updates).length })
}
