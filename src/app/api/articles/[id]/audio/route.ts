/**
 * POST /api/articles/[id]/audio
 * Generate audio version of an article.
 * GET  /api/articles/[id]/audio
 * Check if audio exists.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { generateArticleAudio, getArticleAudioUrl } from '@/lib/audio-articles'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const audioUrl = getArticleAudioUrl(id)
  return NextResponse.json({ ok: true, hasAudio: !!audioUrl, audioUrl })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  const article = await db.article.findUnique({
    where: { id },
    select: { id: true, titleAr: true, bodyAr: true },
  })
  if (!article) return NextResponse.json({ ok: false, error: 'غير موجود' }, { status: 404 })

  const result = await generateArticleAudio(article.id, article.titleAr, article.bodyAr)
  return NextResponse.json(result)
}
