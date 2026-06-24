/**
 * GET /api/search?q=...
 * Full-text search across published articles.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
const prisma = db
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const limit = parseInt(searchParams.get('limit') || '20')
  const categoryId = searchParams.get('categoryId')

  if (!q || q.length < 2) {
    return NextResponse.json({ ok: true, articles: [], total: 0 })
  }

  const where: any = {
    status: 'published',
    OR: [
      { titleAr: { contains: q } },
      { titleEn: { contains: q } },
      { leadAr: { contains: q } },
      { bodyAr: { contains: q } },
      { seoKeywords: { contains: q } },
      { excerpt: { contains: q } },
    ],
  }
  if (categoryId) where.categoryId = categoryId

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
      include: { category: true },
    }),
    prisma.article.count({ where }),
  ])

  return NextResponse.json({ ok: true, articles, total, query: q })
}
