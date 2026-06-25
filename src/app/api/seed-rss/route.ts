/**
 * POST /api/seed-rss
 * Seeds the database with RSS sources from major news outlets.
 */
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import RSS_SOURCES from '@/lib/seed-rss-sources'
import { fetchRssFeed } from '@/lib/rss-parser'

export async function POST() {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  let added = 0
  let skipped = 0
  let failed = 0
  const errors: string[] = []

  for (const source of RSS_SOURCES) {
    try {
      const existing = await db.rssSource.findUnique({ where: { url: source.url } })
      if (existing) {
        skipped++
        continue
      }

      const category = await db.category.findFirst({
        where: { slug: source.category, level: 1 },
        select: { id: true },
      })

      await db.rssSource.create({
        data: {
          name: source.name,
          url: source.url,
          siteName: source.siteName,
          siteUrl: '',
          categoryId: category?.id || null,
          language: source.language,
          isActive: true,
          autoPublish: source.autoPublish,
          aiTone: 'professional',
          aiLength: 'medium',
          includeImages: true,
          watermarkImages: true,
          fetchInterval: 60,
        },
      })
      added++
    } catch (e: any) {
      failed++
      errors.push(`${source.name}: ${e.message}`)
    }
  }

  return NextResponse.json({
    ok: true,
    added,
    skipped,
    failed,
    total: RSS_SOURCES.length,
    errors: errors.slice(0, 5),
  })
}
