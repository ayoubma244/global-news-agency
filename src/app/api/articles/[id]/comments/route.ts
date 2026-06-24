/**
 * /api/articles/[id]/comments
 * GET - list approved comments
 * POST - add new comment
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionId, getVisitorInfo } from '@/lib/session'
import { getZAI, isAIConfigured } from '@/lib/zai'
import { commentSchema, validate } from '@/lib/validation'
import { rateLimit } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const comments = await db.comment.findMany({
    where: { articleId: id, status: 'approved', parentId: null },
    orderBy: { createdAt: 'desc' },
    include: {
      replies: {
        where: { status: 'approved' },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  const count = await db.comment.count({
    where: { articleId: id, status: 'approved' },
  })

  return NextResponse.json({ ok: true, comments, count })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Rate limit: 5 comments per minute per IP
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || 'unknown'
  const rl = await rateLimit(`comment:${ip}`, 5, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: 'تعليقات كثيرة. انتظر دقيقة.' }, { status: 429 })
  }

  const body = await req.json()
  const validation = validate(commentSchema, body)
  if (!validation.success) {
    return NextResponse.json({ ok: false, error: validation.error }, { status: 400 })
  }
  const { authorName, authorEmail, content, parentId } = validation.data

  // Verify article exists
  const article = await db.article.findUnique({ where: { id }, select: { id: true } })
  if (!article) return NextResponse.json({ ok: false, error: 'المقال غير موجود' }, { status: 404 })

  // AI moderation
  let aiModerationScore = 80
  let aiToxicityScore = 10
  let status = 'pending'

  if (isAIConfigured()) {
    try {
      const zai = getZAI()
      const response = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an Arabic comment moderator. Analyze the comment and return ONLY JSON: {"safe": true/false, "toxicityScore": 0-100, "reason": "brief reason"}. Toxicity: insults, hate speech, spam, threats = high score.',
          },
          { role: 'user', content: `Comment by ${authorName}: ${content}` },
        ],
        temperature: 0.2,
        max_tokens: 200,
      })

      const result = response?.choices?.[0]?.message?.content || '{}'
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

      aiToxicityScore = parsed.toxicityScore ?? 10
      aiModerationScore = 100 - aiToxicityScore

      // Auto-approve if very safe, auto-reject if very toxic
      if (aiToxicityScore < 20) status = 'approved'
      else if (aiToxicityScore > 70) status = 'rejected'
      else status = 'pending'
    } catch (e) {
      // If AI fails, set as pending
      status = 'pending'
    }
  } else {
    // No AI - auto-approve (in production, set to pending)
    status = 'approved'
  }

  const visitor = await getVisitorInfo()
  const comment = await db.comment.create({
    data: {
      articleId: id,
      authorName: authorName.slice(0, 50),
      authorEmail: authorEmail?.slice(0, 100) || null,
      content: content.slice(0, 2000),
      parentId: parentId || null,
      status,
      aiModerationScore,
      aiToxicityScore,
      ipAddress: visitor.ip,
      userAgent: visitor.ua.slice(0, 200),
    },
  })

  return NextResponse.json({
    ok: true,
    comment,
    message: status === 'approved'
      ? 'تم نشر تعليقك'
      : status === 'rejected'
      ? 'تم رفض تعليقك (محتوى غير مناسب)'
      : 'تعليقك قيد المراجعة وسيظهر بعد الموافقة',
  })
}
