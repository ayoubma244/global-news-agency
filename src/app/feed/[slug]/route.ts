/**
 * GET /feed/[slug]
 * Per-category RSS feed.
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
const prisma = db
export const dynamic = 'force-dynamic'
export const revalidate = 600

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = await prisma.category.findUnique({ where: { slug } })
  if (!category) return new Response('Not found', { status: 404 })

  // Get all sub category IDs
  const allCats = await prisma.category.findMany({
    where: { OR: [{ id: category.id }, { parentId: category.id }] },
    select: { id: true },
  })
  const catIds = allCats.map(c => c.id)

  const articles = await prisma.article.findMany({
    where: { categoryId: { in: catIds }, status: 'published' },
    orderBy: { publishedAt: 'desc' },
    take: 30,
    include: { category: true },
  })

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com'

  const items = articles.map(a => `    <item>
      <title>${escapeXml(a.titleAr)}</title>
      <link>${base}/article/${a.slug}</link>
      <guid isPermaLink="true">${base}/article/${a.slug}</guid>
      <description>${escapeXml(a.leadAr || a.excerpt || '')}</description>
      <pubDate>${a.publishedAt ? new Date(a.publishedAt).toUTCString() : new Date(a.createdAt).toUTCString()}</pubDate>
    </item>`).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(category.nameAr)} - وكالة الأنباء العالمية</title>
    <link>${base}/category/${category.slug}</link>
    <description>${escapeXml(category.description || category.nameAr)}</description>
    <language>ar</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
