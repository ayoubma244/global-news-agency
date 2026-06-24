/**
 * /api/categories
 * GET    - list all (with hierarchy)
 * POST   - create new
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'

const prisma = db
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const includeInactive = searchParams.get('all') === '1'
  const level = searchParams.get('level')

  const where: any = {}
  if (!includeInactive) where.isActive = true
  if (level) where.level = parseInt(level)

  const cats = await prisma.category.findMany({
    where,
    orderBy: [{ level: 'asc' }, { order: 'asc' }, { nameAr: 'asc' }],
    include: {
      children: {
        orderBy: [{ order: 'asc' }, { nameAr: 'asc' }],
        include: {
          children: {
            orderBy: [{ order: 'asc' }, { nameAr: 'asc' }],
          },
        },
      },
    },
  })

  // Only return top-level with nested children
  const tree = cats.filter(c => c.level === 1)
  return NextResponse.json({ ok: true, categories: tree, total: cats.length })
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const body = await req.json()
  const {
    slug, nameAr, nameEn, nameFr, nameEs,
    icon, description, parentId, level = 1, order = 0,
    isActive = true, priority = 'Medium', frequency,
    seoKeywords, tags, dataSources, templateId,
  } = body

  if (!slug || !nameAr) {
    return NextResponse.json({ ok: false, error: 'الـ slug والاسم العربي مطلوبان' }, { status: 400 })
  }

  // Check slug uniqueness
  const exists = await prisma.category.findUnique({ where: { slug } })
  if (exists) return NextResponse.json({ ok: false, error: 'الـ slug مستخدم مسبقاً' }, { status: 400 })

  // If parent, compute level
  let finalLevel = level
  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parentId } })
    if (!parent) return NextResponse.json({ ok: false, error: 'الأب غير موجود' }, { status: 400 })
    finalLevel = parent.level + 1
  }

  const cat = await prisma.category.create({
    data: {
      slug, nameAr, nameEn: nameEn || nameAr, nameFr: nameFr || nameEn || nameAr,
      nameEs: nameEs || nameEn || nameAr,
      icon, description, parentId: parentId || null, level: finalLevel, order,
      isActive, priority, frequency,
      seoKeywords, tags, dataSources, templateId,
    },
  })

  return NextResponse.json({ ok: true, category: cat })
}
