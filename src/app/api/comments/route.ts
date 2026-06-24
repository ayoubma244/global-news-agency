/**
 * /api/comments
 * GET - list comments (with status filter)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'pending'
  const limit = parseInt(searchParams.get('limit') || '100')

  const where: any = {}
  if (status !== 'all') where.status = status

  const comments = await db.comment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      article: { select: { id: true, titleAr: true, slug: true } },
    },
  })

  return NextResponse.json({ ok: true, comments })
}
