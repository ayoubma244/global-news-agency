/**
 * /api/bookmarks
 * GET - list user's bookmarks
 */
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionId } from '@/lib/session'

export async function GET() {
  const sessionId = await getSessionId()

  const bookmarks = await db.bookmark.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    include: {
      article: {
        select: {
          id: true, slug: true, titleAr: true, leadAr: true, featuredImg: true,
          publishedAt: true, views: true,
          category: { select: { nameAr: true, icon: true, slug: true } },
        },
      },
    },
  })

  return NextResponse.json({
    ok: true,
    bookmarks: bookmarks.map(b => b.article),
    count: bookmarks.length,
  })
}
