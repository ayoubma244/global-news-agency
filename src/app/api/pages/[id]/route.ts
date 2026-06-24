import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'

const prisma = db
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let page = await prisma.page.findUnique({ where: { id } })
  if (!page) page = await prisma.page.findUnique({ where: { slug: id } })
  if (!page) return NextResponse.json({ ok: false, error: 'غير موجود' }, { status: 404 })
  return NextResponse.json({ ok: true, page })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  if (body.slug) {
    const existing = await prisma.page.findFirst({ where: { slug: body.slug, NOT: { id } } })
    if (existing) return NextResponse.json({ ok: false, error: 'الـ slug مستخدم' }, { status: 400 })
  }

  const page = await prisma.page.update({ where: { id }, data: body })
  return NextResponse.json({ ok: true, page })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  await prisma.page.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
