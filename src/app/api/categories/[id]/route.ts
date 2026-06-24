/**
 * /api/categories/[id]
 * GET    - get one
 * PUT    - update
 * DELETE - delete (with cascade)
 * PATCH  - toggle active
 */
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentAdmin } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cat = await prisma.category.findUnique({
    where: { id },
    include: { parent: true, children: true, articles: { take: 5, orderBy: { createdAt: 'desc' } } },
  })
  if (!cat) return NextResponse.json({ ok: false, error: 'غير موجود' }, { status: 404 })
  return NextResponse.json({ ok: true, category: cat })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // If slug changed, ensure unique
  if (body.slug) {
    const existing = await prisma.category.findFirst({
      where: { slug: body.slug, NOT: { id } },
    })
    if (existing) return NextResponse.json({ ok: false, error: 'الـ slug مستخدم مسبقاً' }, { status: 400 })
  }

  // If parent changed, recompute level
  let level: number | undefined
  if (body.parentId !== undefined) {
    if (body.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: body.parentId } })
      if (!parent) return NextResponse.json({ ok: false, error: 'الأب غير موجود' }, { status: 400 })
      if (parent.id === id) return NextResponse.json({ ok: false, error: 'لا يمكن أن يكون الأب نفسه' }, { status: 400 })
      level = parent.level + 1
    } else {
      level = 1
    }
  }

  const updateData: any = { ...body }
  if (level !== undefined) updateData.level = level

  const cat = await prisma.category.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json({ ok: true, category: cat })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  // Will cascade to children + articles due to schema relations
  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const cat = await prisma.category.update({
    where: { id },
    data: { isActive: !!body.isActive },
  })
  return NextResponse.json({ ok: true, category: cat })
}
