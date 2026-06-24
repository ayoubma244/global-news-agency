import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { generateMultiPerspective } from '@/lib/editorial'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const article = await db.article.findUnique({
    where: { id },
    select: { titleAr: true, bodyAr: true },
  })
  if (!article) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })

  const result = await generateMultiPerspective(article.titleAr, article.bodyAr)
  return NextResponse.json({ ok: true, result })
}
