/**
 * Broken Link Checker
 * ====================
 * يفحص الروابط في المقالات ويتحقق من أنها تعمل.
 * - روابط المصادر (sourceUrl)
 * - روابط الصور (featuredImg, ArticleImage.originalUrl)
 * - روابط داخل المحتوى
 */

import { db } from '@/lib/db'

export interface BrokenLink {
  articleId: string
  articleTitle: string
  linkType: 'source' | 'image' | 'content'
  url: string
  statusCode: number | null
  error: string
  checkedAt: Date
}

export interface LinkCheckResult {
  total: number
  ok: number
  broken: number
  brokenLinks: BrokenLink[]
}

/**
 * فحص روابط مقال واحد.
 */
export async function checkArticleLinks(articleId: string): Promise<BrokenLink[]> {
  const article = await db.article.findUnique({
    where: { id: articleId },
    select: { id: true, titleAr: true, sourceUrl: true, featuredImg: true, bodyAr: true, images: { select: { originalUrl: true } } },
  })
  if (!article) return []

  const broken: BrokenLink[] = []
  const urlsToCheck: Array<{ type: 'source' | 'image' | 'content'; url: string }> = []

  // Collect URLs
  if (article.sourceUrl) urlsToCheck.push({ type: 'source', url: article.sourceUrl })
  if (article.featuredImg) urlsToCheck.push({ type: 'image', url: article.featuredImg })
  for (const img of article.images) {
    if (img.originalUrl) urlsToCheck.push({ type: 'image', url: img.originalUrl })
  }

  // Extract URLs from body
  const bodyUrls = article.bodyAr.match(/https?:\/\/[^\s<>"']+/g) || []
  bodyUrls.slice(0, 5).forEach(url => urlsToCheck.push({ type: 'content', url }))

  // Check each URL
  for (const { type, url } of urlsToCheck) {
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot-LinkChecker/2.0)' },
        signal: AbortSignal.timeout(8000),
        redirect: 'follow',
      })

      if (res.status >= 400) {
        broken.push({
          articleId: article.id,
          articleTitle: article.titleAr,
          linkType: type,
          url,
          statusCode: res.status,
          error: `HTTP ${res.status}`,
          checkedAt: new Date(),
        })
      }
    } catch (e: any) {
      // Skip local images (stored in /images/articles/)
      if (url.startsWith('/')) continue
      broken.push({
        articleId: article.id,
        articleTitle: article.titleAr,
        linkType: type,
        url,
        statusCode: null,
        error: e.message?.slice(0, 200) || 'Connection failed',
        checkedAt: new Date(),
      })
    }
  }

  return broken
}

/**
 * فحص روابط كل المقالات (batch - محدود بـ 50 مقال).
 */
export async function checkAllLinks(limit: number = 50): Promise<LinkCheckResult> {
  const articles = await db.article.findMany({
    where: { status: 'published' },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    select: { id: true },
  })

  const allBroken: BrokenLink[] = []
  let okCount = 0

  for (const article of articles) {
    const broken = await checkArticleLinks(article.id)
    if (broken.length === 0) {
      okCount++
    } else {
      allBroken.push(...broken)
    }
  }

  return {
    total: articles.length,
    ok: okCount,
    broken: allBroken.length,
    brokenLinks: allBroken,
  }
}
