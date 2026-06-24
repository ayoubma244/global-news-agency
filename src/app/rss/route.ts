/**
 * GET /rss
 * Global RSS feed for all published articles.
 */
import { db } from '@/lib/db'
const prisma = db
export const dynamic = 'force-dynamic'
export const revalidate = 600 // 10 min

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const articles = await prisma.article.findMany({
    where: { status: 'published' },
    orderBy: { publishedAt: 'desc' },
    take: 50,
    include: { category: true },
  })

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com'
  const siteName = 'وكالة الأنباء العالمية'
  const siteDesc = 'آخر أخبار العالم في السياسة والاقتصاد والرياضة والتكنولوجيا'

  const items = articles.map(a => `    <item>
      <title>${escapeXml(a.titleAr)}</title>
      <link>${base}/article/${a.slug}</link>
      <guid isPermaLink="true">${base}/article/${a.slug}</guid>
      <description>${escapeXml(a.leadAr || a.excerpt || '')}</description>
      <category>${escapeXml(a.category?.nameAr || '')}</category>
      ${a.featuredImg ? `<enclosure url="${a.featuredImg}" type="image/jpeg" />` : ''}
      <pubDate>${a.publishedAt ? new Date(a.publishedAt).toUTCString() : new Date(a.createdAt).toUTCString()}</pubDate>
      <author>${escapeXml(a.author || 'Automated')}</author>
    </item>`).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${base}</link>
    <description>${escapeXml(siteDesc)}</description>
    <language>ar</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${base}/rss" rel="self" type="application/rss+xml" />
    <image>
      <url>${base}/logo.png</url>
      <title>${escapeXml(siteName)}</title>
      <link>${base}</link>
    </image>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  })
}
