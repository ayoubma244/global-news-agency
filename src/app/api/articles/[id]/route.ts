import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'

const prisma = db
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Try by id, fallback to slug
  let article = await prisma.article.findUnique({
    where: { id },
    include: { category: true },
  })
  if (!article) {
    article = await prisma.article.findUnique({
      where: { slug: id },
      include: { category: true },
    })
  }
  if (!article) return NextResponse.json({ ok: false, error: 'غير موجود' }, { status: 404 })

  // Increment views (only if not admin viewing)
  await prisma.article.update({
    where: { id: article.id },
    data: { views: { increment: 1 } },
  })

  return NextResponse.json({ ok: true, article })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // If publishing, set publishedAt
  if (body.status === 'published') {
    const existing = await prisma.article.findUnique({ where: { id } })
    if (existing && !existing.publishedAt) {
      body.publishedAt = new Date()
    }
  }

  const article = await prisma.article.update({
    where: { id },
    data: body,
    include: { category: true },
  })
  return NextResponse.json({ ok: true, article })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  await prisma.article.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
