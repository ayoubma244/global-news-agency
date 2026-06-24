/**
 * /api/articles/[id]/bookmark
 * POST - toggle bookmark
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionId } from '@/lib/session'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sessionId = await getSessionId()

  const existing = await db.bookmark.findUnique({
    where: { articleId_sessionId: { articleId: id, sessionId } },
  })

  if (existing) {
    await db.bookmark.delete({ where: { id: existing.id } })
    return NextResponse.json({ ok: true, action: 'removed' })
  } else {
    await db.bookmark.create({
      data: { articleId: id, sessionId },
    })
    return NextResponse.json({ ok: true, action: 'added' })
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sessionId = await getSessionId()

  const bookmark = await db.bookmark.findUnique({
    where: { articleId_sessionId: { articleId: id, sessionId } },
  })

  return NextResponse.json({ ok: true, isBookmarked: !!bookmark })
}
