/**
 * /api/articles/[id]/related
 * GET - get related articles (same category, excludes current)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const article = await db.article.findUnique({
    where: { id },
    select: { categoryId: true, tags: true },
  })
  if (!article) return NextResponse.json({ ok: false, error: 'غير موجود' }, { status: 404 })

  // Get articles from same category
  const related = await db.article.findMany({
    where: {
      categoryId: article.categoryId,
      status: 'published',
      NOT: { id },
    },
    take: 6,
    orderBy: { publishedAt: 'desc' },
    include: {
      category: { select: { nameAr: true, icon: true } },
    },
  })

  return NextResponse.json({ ok: true, related })
}
