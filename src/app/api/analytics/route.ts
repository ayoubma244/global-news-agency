/**
 * GET /api/analytics
 * Returns analytics data for the admin dashboard.
 * - Total views (30d, 7d, today)
 * - Top articles (by views)
 * - Articles per category
 * - Publishing trend (last 14 days)
 * - Subscribers count
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'

const prisma = db
export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const range = searchParams.get('range') || '30d'

  const days = range === '7d' ? 7 : range === '24h' ? 1 : range === '90d' ? 90 : 30
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const [
    totalArticles,
    publishedArticles,
    totalViews,
    recentViews,
    todayViews,
    topArticles,
    categoriesWithCounts,
    subscribers,
    last14Days,
    automationLogs,
  ] = await Promise.all([
    prisma.article.count(),
    prisma.article.count({ where: { status: 'published' } }),
    prisma.article.aggregate({ _sum: { views: true } }),
    prisma.articleView.count({ where: { viewedAt: { gte: since } } }),
    prisma.articleView.count({ where: { viewedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    prisma.article.findMany({
      where: { status: 'published' },
      orderBy: { views: 'desc' },
      take: 10,
      select: { id: true, titleAr: true, slug: true, views: true, createdAt: true, category: { select: { nameAr: true, icon: true } } },
    }),
    prisma.category.findMany({
      where: { level: 1, isActive: true },
      select: {
        id: true, nameAr: true, icon: true,
        _count: { select: { articles: { where: { status: 'published' } } } },
      },
      orderBy: { order: 'asc' },
    }),
    prisma.subscriber.count({ where: { isActive: true } }),
    // Views per day for last 14 days
    prisma.$queryRaw`
      SELECT DATE(viewedAt) as date, COUNT(*) as count
      FROM ArticleView
      WHERE viewedAt >= ${new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)}
      GROUP BY DATE(viewedAt)
      ORDER BY DATE(viewedAt) ASC
    `,
    // Automation runs per day
    prisma.$queryRaw`
      SELECT DATE(createdAt) as date, COUNT(*) as count, status
      FROM AutomationLog
      WHERE createdAt >= ${new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)}
      GROUP BY DATE(createdAt), status
      ORDER BY DATE(createdAt) ASC
    `,
  ])

  // Format last 14 days
  const viewsTrend = (last14Days as any[]).map(r => ({
    date: r.date,
    count: Number(r.count),
  }))

  const automationTrend = (automationLogs as any[]).reduce((acc: any, r: any) => {
    const d = r.date
    if (!acc[d]) acc[d] = { date: d, success: 0, error: 0 }
    acc[d][r.status] = Number(r.count)
    return acc
  }, {})

  return NextResponse.json({
    ok: true,
    summary: {
      totalArticles,
      publishedArticles,
      draftArticles: totalArticles - publishedArticles,
      totalViews: totalViews._sum.views || 0,
      recentViews,
      todayViews,
      subscribers,
    },
    topArticles,
    categoriesWithCounts: categoriesWithCounts.map(c => ({
      id: c.id,
      nameAr: c.nameAr,
      icon: c.icon,
      count: c._count.articles,
    })),
    viewsTrend,
    automationTrend: Object.values(automationTrend),
  })
}
