/**
 * POST /api/social-post
 * Manually post an article to social media platforms.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { postToAllSocialPlatforms, isSocialConfigured } from '@/lib/social'

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const body = await req.json()
  const { articleId } = body

  const article = await db.article.findUnique({
    where: { id: articleId },
    include: { category: { select: { nameAr: true, icon: true } } },
  })
  if (!article) return NextResponse.json({ ok: false, error: 'المقال غير موجود' }, { status: 404 })

  const results = await postToAllSocialPlatforms({
    id: article.id,
    titleAr: article.titleAr,
    slug: article.slug,
    featuredImg: article.featuredImg,
    isBreaking: article.isBreaking,
    category: article.category,
  })

  const configured = isSocialConfigured()
  const success = results.filter(r => r.ok).length
  const failed = results.filter(r => !r.ok && r.error !== 'Not configured').length

  return NextResponse.json({
    ok: true,
    results,
    summary: {
      total: results.length,
      success,
      failed,
      notConfigured: results.length - success - failed,
    },
    configured,
  })
}
