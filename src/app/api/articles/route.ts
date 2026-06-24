/**
 * /api/articles
 * GET  - list (filterable)
 * POST - create
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'

const prisma = db
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const categoryId = searchParams.get('categoryId')
  const isBreaking = searchParams.get('breaking')
  const isFeatured = searchParams.get('featured')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const search = searchParams.get('q')
  const publishedOnly = searchParams.get('published') === '1'

  const where: any = {}
  if (status) where.status = status
  else if (publishedOnly) where.status = 'published'
  if (categoryId) where.categoryId = categoryId
  if (isBreaking === '1') where.isBreaking = true
  if (isFeatured === '1') where.isFeatured = true
  if (search) {
    where.OR = [
      { titleAr: { contains: search } },
      { titleEn: { contains: search } },
      { bodyAr: { contains: search } },
    ]
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        category: true,
        rssSource: { select: { name: true } },
      },
    }),
    prisma.article.count({ where }),
  ])

  return NextResponse.json({ ok: true, articles, total, limit, offset })
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const body = await req.json()
  const {
    titleAr, titleEn, leadAr, leadEn, bodyAr, bodyEn,
    excerpt, featuredImg, categoryId, sourceUrl, sourceName,
    author, status = 'draft', isBreaking = false, isFeatured = false,
    seoTitle, seoDescription, seoKeywords, publishedAt,
  } = body

  if (!titleAr || !bodyAr || !categoryId) {
    return NextResponse.json({ ok: false, error: 'العنوان والمحتوى والكاتيجوري مطلوبون' }, { status: 400 })
  }

  // Generate slug from title
  const slug = (titleEn || titleAr)
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80) + '-' + Date.now().toString(36)

  const article = await prisma.article.create({
    data: {
      slug, titleAr, titleEn, leadAr, leadEn, bodyAr, bodyEn,
      excerpt, featuredImg,
      categoryId, sourceUrl, sourceName, author: author || admin.username,
      status, isBreaking, isFeatured,
      seoTitle, seoDescription, seoKeywords,
      publishedAt: status === 'published' ? (publishedAt || new Date()) : publishedAt,
    },
    include: { category: true },
  })

  return NextResponse.json({ ok: true, article })
}
