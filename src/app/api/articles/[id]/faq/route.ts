/**
 * /api/articles/[id]/faq
 * POST - generate FAQs
 * GET  - get existing FAQs
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { generateFAQ } from '@/lib/faq-generator'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const article = await db.article.findUnique({
    where: { id },
    select: { factCheckNotes: true },
  })

  if (!article?.factCheckNotes) {
    return NextResponse.json({ ok: false, faqs: [] })
  }

  try {
    const data = JSON.parse(article.factCheckNotes)
    return NextResponse.json({ ok: true, faqs: data.faqs || [] })
  } catch {
    return NextResponse.json({ ok: false, faqs: [] })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  const article = await db.article.findUnique({
    where: { id },
    include: { category: { select: { nameAr: true } } },
  })
  if (!article) return NextResponse.json({ ok: false, error: 'غير موجود' }, { status: 404 })

  const result = await generateFAQ(
    article.id,
    article.titleAr,
    article.bodyAr,
    article.category?.nameAr
  )

  return NextResponse.json({ ok: true, ...result })
}
