/**
 * POST /api/rss-sources/seed
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
      // Check if already exists
      const existing = await db.rssSource.findUnique({ where: { url: source.url } })
      if (existing) {
        skipped++
        continue
      }

      // Find category by slug
      const category = await db.category.findFirst({
        where: { slug: source.category, level: 1 },
        select: { id: true },
      })

      // Try to fetch the feed to validate
      let feedInfo = null
      try {
        const feed = await fetchRssFeed(source.url)
        feedInfo = { title: feed.title, items: feed.items.length }
      } catch (e: any) {
        // Save anyway, mark as error
      }

      await db.rssSource.create({
        data: {
          name: source.name,
          url: source.url,
          siteName: source.siteName,
          siteUrl: source.url.replace(/\/rss.*$/, ''),
          categoryId: category?.id || null,
          language: source.language,
          isActive: true,
          autoPublish: source.autoPublish,
          aiTone: 'professional',
          aiLength: 'medium',
          includeImages: true,
          watermarkImages: true,
          fetchInterval: 60,
          lastFetchStatus: feedInfo ? 'success' : null,
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
