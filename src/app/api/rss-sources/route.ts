/**
 * /api/rss-sources
 * GET  - list all
 * POST - create new
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { fetchRssFeed } from '@/lib/rss-parser'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const activeOnly = searchParams.get('active') === '1'

  const where: any = {}
  if (activeOnly) where.isActive = true

  const sources = await db.rssSource.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { category: { select: { id: true, nameAr: true, icon: true } } },
  })

  return NextResponse.json({ ok: true, sources })
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const body = await req.json()
  const {
    name, url, siteName, siteUrl, categoryId, language = 'ar',
    isActive = true, fetchInterval = 60, tags, autoPublish = false,
    aiTone = 'professional', aiLength = 'medium',
    includeImages = true, watermarkImages = true,
  } = body

  if (!name || !url) {
    return NextResponse.json({ ok: false, error: 'الاسم والـ URL مطلوبان' }, { status: 400 })
  }

  // Check URL uniqueness
  const exists = await db.rssSource.findUnique({ where: { url } })
  if (exists) return NextResponse.json({ ok: false, error: 'هذا الرابط مسجل مسبقاً' }, { status: 400 })

  // Try to fetch the feed to validate it
  try {
    const feed = await fetchRssFeed(url)
    // Auto-fill siteName if not provided
    const finalSiteName = siteName || feed.title
    const finalSiteUrl = siteUrl || feed.link

    const source = await db.rssSource.create({
      data: {
        name, url, siteName: finalSiteName, siteUrl: finalSiteUrl,
        categoryId: categoryId || null, language, isActive,
        fetchInterval, tags, autoPublish,
        aiTone, aiLength, includeImages, watermarkImages,
      },
      include: { category: true },
    })

    await logActivity(
      { userId: admin.id, username: admin.username, role: admin.role, exp: 0 },
      'create', 'rss_source',
      { entityId: source.id, entityName: name, details: { url, items: feed.items.length } }
    )

    return NextResponse.json({
      ok: true,
      source,
      feedInfo: { title: feed.title, items: feed.items.length },
    })
  } catch (e: any) {
    // Save anyway, but warn
    const source = await db.rssSource.create({
      data: {
        name, url, siteName, siteUrl, categoryId: categoryId || null,
        language, isActive, fetchInterval, tags, autoPublish,
        aiTone, aiLength, includeImages, watermarkImages,
        lastFetchStatus: 'error', lastError: e.message,
      },
    })
    return NextResponse.json({
      ok: true,
      source,
      warning: `تم الحفظ لكن فشل التحقق من الرابط: ${e.message}`,
    })
  }
}
