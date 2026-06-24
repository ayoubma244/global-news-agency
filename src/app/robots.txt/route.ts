/**
 * GET /robots.txt
 */
import { db } from '@/lib/db'
const prisma = db
export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com'
  const txt = `# robots.txt for Global News Agency
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /login
Disallow: /install

# Sitemaps
Sitemap: ${base}/sitemap.xml

# Crawl delay (be nice)
Crawl-delay: 1

# Block aggressive bots
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: MJ12bot
Disallow: /
`
  return new Response(txt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
