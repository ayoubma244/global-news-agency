/**
 * GET /api/trending
 * Returns trending topics based on views, reactions, recency.
 */
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Trending = high views in last 24h
  const trending24h = await db.article.findMany({
    where: {
      status: 'published',
      publishedAt: { gte: last24h },
    },
    orderBy: { views: 'desc' },
    take: 10,
    include: { category: { select: { nameAr: true, icon: true, slug: true } } },
  })

  // Popular this week
  const popular7d = await db.article.findMany({
    where: {
      status: 'published',
      publishedAt: { gte: last7d },
    },
    orderBy: { views: 'desc' },
    take: 10,
    include: { category: { select: { nameAr: true, icon: true, slug: true } } },
  })

  // Trending categories (by article count + views)
  const categories = await db.category.findMany({
    where: { level: 1, isActive: true },
    select: {
      id: true, nameAr: true, icon: true, slug: true,
      _count: { select: { articles: { where: { status: 'published', publishedAt: { gte: last7d } } } } },
    },
  })

  const trendingCategories = categories
    .filter(c => c._count.articles > 0)
    .sort((a, b) => b._count.articles - a._count.articles)
    .slice(0, 5)
    .map(c => ({
      id: c.id,
      nameAr: c.nameAr,
      icon: c.icon,
      slug: c.slug,
      articlesCount: c._count.articles,
    }))

  // Top keywords (from last 50 articles)
  const recentArticles = await db.article.findMany({
    where: { status: 'published', publishedAt: { gte: last7d } },
    take: 50,
    select: { seoKeywords: true },
  })

  const keywordCount = new Map<string, number>()
  recentArticles.forEach(a => {
    if (a.seoKeywords) {
      a.seoKeywords.split(',').forEach(k => {
        const key = k.trim().toLowerCase()
        if (key.length > 2) {
          keywordCount.set(key, (keywordCount.get(key) || 0) + 1)
        }
      })
    }
  })

  const trendingKeywords = Array.from(keywordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([keyword, count]) => ({ keyword, count }))

  return NextResponse.json({
    ok: true,
    trending24h: trending24h.map(a => ({
      id: a.id, slug: a.slug, titleAr: a.titleAr, views: a.views,
      isBreaking: a.isBreaking, category: a.category,
      publishedAt: a.publishedAt,
    })),
    popular7d: popular7d.map(a => ({
      id: a.id, slug: a.slug, titleAr: a.titleAr, views: a.views,
      category: a.category, publishedAt: a.publishedAt,
    })),
    trendingCategories,
    trendingKeywords,
  })
}
