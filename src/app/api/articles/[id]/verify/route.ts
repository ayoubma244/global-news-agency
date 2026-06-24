/**
 * POST /api/articles/[id]/verify
 * يُعيد التحقق من مقال باستخدام Semantic Verification Layer.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { verifyArticle } from '@/lib/semantic-verify'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  const article = await db.article.findUnique({
    where: { id },
    select: {
      id: true,
      titleAr: true,
      bodyAr: true,
      sourceUrl: true,
      sourceName: true,
      factCheckNotes: true,
    },
  })

  if (!article) return NextResponse.json({ ok: false, error: 'غير موجود' }, { status: 404 })

  // Try to fetch original source content
  let sourceContent = ''
  let sourceTitle = ''
  if (article.sourceUrl) {
    try {
      const res = await fetch(article.sourceUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/2.0)' },
        signal: AbortSignal.timeout(10000),
      })
      if (res.ok) {
        const html = await res.text()
        // Extract title
        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
        sourceTitle = titleMatch ? titleMatch[1].trim() : ''
        // Extract text content (basic)
        sourceContent = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 5000)
      }
    } catch (e: any) {
      // If fetch fails, use stored content
    }
  }

  // Fallback: use stored factCheckNotes as "source" if fetch failed
  if (!sourceContent) {
    return NextResponse.json({
      ok: false,
      error: 'تعذّر جلب المحتوى الأصلي من المصدر. تأكد من أن الرابط لا يزال متاحاً.',
    }, { status: 400 })
  }

  // Run semantic verification
  const result = await verifyArticle(
    sourceContent,
    sourceTitle,
    article.bodyAr,
    article.titleAr
  )

  // Update article with new verification results
  await db.article.update({
    where: { id },
    data: {
      factCheckNotes: JSON.stringify({
        status: result.status,
        confidence: result.confidence,
        factCheckScore: result.factCheckResult?.score,
        claims: {
          total: result.claims?.length || 0,
          verified: result.claims?.filter(c => c.verified).length || 0,
          unverified: result.claims?.filter(c => !c.verified).length || 0,
        },
        hallucinations: result.aiVerification ? {
          addedDetails: result.aiVerification.addedDetails.length,
          alteredQuotes: result.aiVerification.alteredQuotes.length,
          meaningShift: result.aiVerification.meaningShift.length,
          unsupportedClaims: result.aiVerification.unsupportedClaims.length,
          assessment: result.aiVerification.overallAssessment,
        } : null,
        recommendations: result.recommendations,
        needsManualReview: result.needsManualReview,
        verifiedAt: new Date().toISOString(),
      }),
    },
  })

  return NextResponse.json({ ok: true, verification: result })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  const article = await db.article.findUnique({
    where: { id },
    select: { factCheckNotes: true },
  })

  if (!article?.factCheckNotes) {
    return NextResponse.json({ ok: false, error: 'لا يوجد تحقق سابق' }, { status: 404 })
  }

  try {
    const verification = JSON.parse(article.factCheckNotes)
    return NextResponse.json({ ok: true, verification })
  } catch {
    return NextResponse.json({ ok: false, error: 'بيانات تالفة' }, { status: 500 })
  }
}
