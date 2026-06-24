/**
 * POST /api/newsletter/send
 * Admin: send newsletter to all verified subscribers.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { sendEmail, newsletterEmail, isEmailConfigured } from '@/lib/email'

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  if (!isEmailConfigured()) {
    return NextResponse.json({
      ok: false,
      error: 'لم يتم إعداد خدمة البريد الإلكتروني. أضف RESEND_API_KEY أو SMTP في .env',
    }, { status: 400 })
  }

  // Get latest 10 published articles
  const articles = await db.article.findMany({
    where: { status: 'published' },
    orderBy: { publishedAt: 'desc' },
    take: 10,
    include: { category: { select: { nameAr: true, icon: true } } },
  })

  if (articles.length === 0) {
    return NextResponse.json({ ok: false, error: 'لا توجد مقالات منشورة لإرسالها' }, { status: 400 })
  }

  // Get verified subscribers
  const subscribers = await db.subscriber.findMany({
    where: { isActive: true, isVerified: true },
    select: { email: true, name: true },
  })

  if (subscribers.length === 0) {
    return NextResponse.json({ ok: false, error: 'لا يوجد مشتركون مؤكدون' }, { status: 400 })
  }

  const { subject, html } = newsletterEmail(articles.map(a => ({
    titleAr: a.titleAr,
    leadAr: a.leadAr,
    slug: a.slug,
    featuredImg: a.featuredImg,
    category: a.category,
  })))

  // Send to all subscribers (BCC for privacy)
  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const sub of subscribers) {
    const result = await sendEmail({
      to: sub.email,
      subject,
      html,
    })
    if (result.ok) sent++
    else {
      failed++
      errors.push(`${sub.email}: ${result.error}`)
    }
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 100))
  }

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    total: subscribers.length,
    errors: errors.slice(0, 5),
  })
}
