/**
 * /api/pages - CMS pages CRUD
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'

const prisma = db
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const publishedOnly = searchParams.get('published') === '1'
  const menuOnly = searchParams.get('menu') === '1'

  const where: any = {}
  if (publishedOnly) where.isPublished = true
  if (menuOnly) {
    where.isPublished = true
    where.showInMenu = true
  }

  const pages = await prisma.page.findMany({
    where,
    orderBy: { order: 'asc' },
  })
  return NextResponse.json({ ok: true, pages })
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const body = await req.json()
  const { slug, titleAr, titleEn, contentAr, contentEn, template, isPublished, showInMenu, order, seoTitle, seoDescription } = body

  if (!slug || !titleAr || !contentAr) {
    return NextResponse.json({ ok: false, error: 'الـ slug والعنوان والمحتوى مطلوبون' }, { status: 400 })
  }

  const exists = await prisma.page.findUnique({ where: { slug } })
  if (exists) return NextResponse.json({ ok: false, error: 'الـ slug مستخدم' }, { status: 400 })

  const page = await prisma.page.create({
    data: { slug, titleAr, titleEn, contentAr, contentEn, template: template || 'default', isPublished: isPublished ?? true, showInMenu: showInMenu ?? false, order: order ?? 0, seoTitle, seoDescription },
  })
  return NextResponse.json({ ok: true, page })
}
