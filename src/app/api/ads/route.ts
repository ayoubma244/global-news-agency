/**
 * /api/ads
 * GET  - list active ads (public)
 * POST - create new (admin)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const position = searchParams.get('position')
  const admin = searchParams.get('admin') === '1'

  // If admin, return all
  if (admin) {
    const current = await getCurrentAdmin()
    if (!current) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })
    const ads = await db.adSpace.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ ok: true, ads })
  }

  // Public: return active ads for a position
  const now = new Date()
  const where: any = { isActive: true }
  if (position) where.position = position
  where.OR = [
    { startDate: null, endDate: null },
    { startDate: { lte: now }, endDate: null },
    { startDate: null, endDate: { gte: now } },
    { startDate: { lte: now }, endDate: { gte: now } },
  ]

  const ads = await db.adSpace.findMany({ where, take: 5 })

  // Increment impressions (fire and forget)
  for (const ad of ads) {
    db.adSpace.update({
      where: { id: ad.id },
      data: { impressions: { increment: 1 } },
    }).catch(() => null)
  }

  return NextResponse.json({ ok: true, ads })
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const body = await req.json()
  const { name, position, type, content, imageUrl, linkUrl, isActive, startDate, endDate } = body

  if (!name || !position) {
    return NextResponse.json({ ok: false, error: 'الاسم والموقع مطلوبان' }, { status: 400 })
  }

  const ad = await db.adSpace.create({
    data: {
      name, position, type: type || 'banner',
      content, imageUrl, linkUrl,
      isActive: isActive ?? true,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  })

  return NextResponse.json({ ok: true, ad })
}
