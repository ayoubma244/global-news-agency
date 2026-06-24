/**
 * GET /sitemap.xml
 * Dynamic XML sitemap for SEO.
 */
import { db } from '@/lib/db'
const prisma = db
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // 1 hour

function url(path: string, lastmod?: string, changefreq = 'daily', priority = '0.8') {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com'
  return `  <url>
    <loc>${base}${path}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

export async function GET() {
  const [categories, articles, pages] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true, level: true, updatedAt: true } }),
    prisma.article.findMany({
      where: { status: 'published' },
      select: { slug: true, updatedAt: true, isBreaking: true, isFeatured: true },
      orderBy: { publishedAt: 'desc' },
      take: 5000,
    }),
    prisma.page.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
  ])

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com'

  const urls: string[] = []
  // Homepage
  urls.push(url('/', new Date().toISOString(), 'hourly', '1.0'))

  // Categories
  for (const c of categories) {
    if (c.level === 1) {
      urls.push(url(`/category/${c.slug}`, c.updatedAt.toISOString(), 'daily', '0.9'))
    }
  }

  // Articles
  for (const a of articles) {
    const priority = a.isBreaking ? '0.95' : a.isFeatured ? '0.9' : '0.7'
    urls.push(url(`/article/${a.slug}`, a.updatedAt.toISOString(), 'weekly', priority))
  }

  // Pages
  for (const p of pages) {
    urls.push(url(`/${p.slug}`, p.updatedAt.toISOString(), 'monthly', '0.5'))
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
