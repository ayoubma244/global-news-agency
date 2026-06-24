/**
 * /api/articles/[id]/live
 * GET  - list live updates
 * POST - add live update (admin)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const updates = await db.liveUpdate.findMany({
    where: { articleId: id },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json({ ok: true, updates })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { content, type = 'update', isPinned = false } = body

  if (!content) return NextResponse.json({ ok: false, error: 'المحتوى مطلوب' }, { status: 400 })

  const update = await db.liveUpdate.create({
    data: {
      articleId: id,
      content,
      type,
      isPinned,
      author: admin.username,
    },
  })

  return NextResponse.json({ ok: true, update })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const updateId = searchParams.get('updateId')

  if (updateId) {
    await db.liveUpdate.delete({ where: { id: updateId } })
  } else {
    await db.liveUpdate.deleteMany({ where: { articleId: id } })
  }

  return NextResponse.json({ ok: true })
}
