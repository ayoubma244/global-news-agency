/**
 * GET /api/seo-audit/[id] - audit article SEO
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { auditSEO } from '@/lib/seo-audit'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  const article = await db.article.findUnique({
    where: { id },
    include: { category: { select: { nameAr: true } } },
  })
  if (!article) return NextResponse.json({ ok: false, error: 'غير موجود' }, { status: 404 })

  const result = auditSEO(article)
  return NextResponse.json({ ok: true, audit: result })
}
