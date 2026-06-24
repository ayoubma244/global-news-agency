/**
 * /api/history
 * GET - list user's reading history
 * POST - track reading progress
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionId } from '@/lib/session'

export async function GET() {
  const sessionId = await getSessionId()

  // Get distinct articles from history (most recent first)
  const history = await db.readingHistory.findMany({
    where: { sessionId },
    orderBy: { viewedAt: 'desc' },
    take: 50,
    include: {
      article: {
        select: {
          id: true, slug: true, titleAr: true, leadAr: true, featuredImg: true,
          publishedAt: true,
          category: { select: { nameAr: true, icon: true, slug: true } },
        },
      },
    },
    distinct: ['articleId'],
  })

  return NextResponse.json({
    ok: true,
    history: history.map(h => ({ ...h.article, readProgress: h.readProgress, viewedAt: h.viewedAt })),
    count: history.length,
  })
}

export async function POST(req: NextRequest) {
  const sessionId = await getSessionId()
  const body = await req.json()
  const { articleId, readProgress, readingTime } = body

  if (!articleId) {
    return NextResponse.json({ ok: false, error: 'articleId required' }, { status: 400 })
  }

  const history = await db.readingHistory.create({
    data: {
      articleId,
      sessionId,
      readProgress: readProgress || null,
      readingTime: readingTime || null,
    },
  })

  return NextResponse.json({ ok: true, history })
}
