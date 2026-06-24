/**
 * POST /api/articles/[id]/summary
 * Generate AI summary for an article.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { generateArticleSummary } from '@/lib/ai-summary'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  const article = await db.article.findUnique({
    where: { id },
    select: { id: true, titleAr: true, bodyAr: true, leadAr: true },
  })
  if (!article) return NextResponse.json({ ok: false, error: 'غير موجود' }, { status: 404 })

  const summary = await generateArticleSummary(article)
  return NextResponse.json({ ok: true, summary })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const summary = await db.articleSummary.findUnique({ where: { articleId: id } })
  if (!summary) return NextResponse.json({ ok: false, error: 'لا يوجد ملخص' }, { status: 404 })
  return NextResponse.json({
    ok: true,
    summary: {
      ...summary,
      keyPoints: summary.keyPoints ? JSON.parse(summary.keyPoints) : [],
    },
  })
}
