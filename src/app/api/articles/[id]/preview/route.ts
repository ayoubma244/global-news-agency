/**
 * POST /api/articles/[id]/preview
 * Returns a preview-ready article with all images and AI metadata.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  const article = await db.article.findUnique({
    where: { id },
    include: {
      category: true,
      images: { orderBy: { order: 'asc' } },
      rssSource: { select: { name: true, siteName: true, siteUrl: true, aiTone: true, aiLength: true } },
    },
  })

  if (!article) return NextResponse.json({ ok: false, error: 'غير موجود' }, { status: 404 })

  return NextResponse.json({
    ok: true,
    article: {
      ...article,
      // AI quality info
      aiInfo: {
        tone: article.aiToneUsed,
        length: article.aiLengthUsed,
        model: article.aiModel,
        plagiarismScore: article.plagiarismScore,
        humanScore: article.humanScore,
        qualityScore: article.humanScore && article.plagiarismScore
          ? Math.round(article.humanScore * 0.6 + (100 - article.plagiarismScore) * 0.4)
          : null,
      },
    },
  })
}
