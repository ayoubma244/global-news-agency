/**
 * GET /api/articles/[id]/links
 * Find smart internal links for an article.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { findInternalLinks } from '@/lib/internal-linking'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const article = await db.article.findUnique({
    where: { id },
    select: { id: true, titleAr: true, bodyAr: true, seoKeywords: true, categoryId: true },
  })
  if (!article) return NextResponse.json({ ok: false, error: 'غير موجود' }, { status: 404 })

  const result = await findInternalLinks(
    article.id,
    article.titleAr,
    article.bodyAr,
    article.seoKeywords || '',
    article.categoryId,
    5
  )

  return NextResponse.json({ ok: true, ...result })
}
