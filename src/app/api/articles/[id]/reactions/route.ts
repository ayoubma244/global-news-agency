/**
 * /api/articles/[id]/reactions
 * GET  - get reaction counts
 * POST - toggle a reaction (like/love/wow/sad/angry)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionId } from '@/lib/session'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sessionId = await getSessionId()

  const reactions = await db.reaction.groupBy({
    by: ['type'],
    where: { articleId: id },
    _count: true,
  })

  const userReactions = await db.reaction.findMany({
    where: { articleId: id, sessionId },
    select: { type: true },
  })

  const counts: Record<string, number> = {
    like: 0, love: 0, wow: 0, sad: 0, angry: 0,
  }
  for (const r of reactions) {
    counts[r.type] = r._count
  }

  return NextResponse.json({
    ok: true,
    counts,
    userReactions: userReactions.map(r => r.type),
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { type } = body

  if (!['like', 'love', 'wow', 'sad', 'angry'].includes(type)) {
    return NextResponse.json({ ok: false, error: 'نوع غير صالح' }, { status: 400 })
  }

  const sessionId = await getSessionId()

  // Toggle: if exists, delete; else create
  const existing = await db.reaction.findUnique({
    where: {
      articleId_sessionId_type: { articleId: id, sessionId, type },
    },
  })

  if (existing) {
    await db.reaction.delete({ where: { id: existing.id } })
    return NextResponse.json({ ok: true, action: 'removed', type })
  } else {
    await db.reaction.create({
      data: { articleId: id, sessionId, type },
    })
    return NextResponse.json({ ok: true, action: 'added', type })
  }
}
