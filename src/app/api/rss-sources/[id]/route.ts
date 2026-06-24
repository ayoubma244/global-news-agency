/**
 * /api/rss-sources/[id]
 * GET    - get one
 * PUT    - update
 * DELETE - delete
 * PATCH  - toggle active
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const source = await db.rssSource.findUnique({
    where: { id },
    include: {
      category: true,
      articles: { take: 10, orderBy: { createdAt: 'desc' }, select: { id: true, titleAr: true, slug: true, status: true, createdAt: true } },
    },
  })
  if (!source) return NextResponse.json({ ok: false, error: 'غير موجود' }, { status: 404 })
  return NextResponse.json({ ok: true, source })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  if (body.url) {
    const existing = await db.rssSource.findFirst({ where: { url: body.url, NOT: { id } } })
    if (existing) return NextResponse.json({ ok: false, error: 'الـ URL مستخدم' }, { status: 400 })
  }

  const source = await db.rssSource.update({
    where: { id },
    data: body,
    include: { category: true },
  })

  await logActivity(
    { userId: admin.id, username: admin.username, role: admin.role, exp: 0 },
    'update', 'rss_source',
    { entityId: id, entityName: source.name }
  )

  return NextResponse.json({ ok: true, source })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  const source = await db.rssSource.delete({ where: { id }, select: { name: true } })

  await logActivity(
    { userId: admin.id, username: admin.username, role: admin.role, exp: 0 },
    'delete', 'rss_source',
    { entityId: id, entityName: source.name }
  )

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Support toggling isActive OR autoPublish
  const updateData: any = {}
  if (body.isActive !== undefined) updateData.isActive = !!body.isActive
  if (body.autoPublish !== undefined) updateData.autoPublish = !!body.autoPublish
  if (body.includeImages !== undefined) updateData.includeImages = !!body.includeImages
  if (body.watermarkImages !== undefined) updateData.watermarkImages = !!body.watermarkImages

  const source = await db.rssSource.update({
    where: { id },
    data: updateData,
  })
  return NextResponse.json({ ok: true, source })
}
