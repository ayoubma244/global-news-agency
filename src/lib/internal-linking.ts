/**
 * Smart Internal Linking Engine
 * ==============================
 * يربط المقالات ببعضها تلقائياً بناءً على:
 * - تشابه المحتوى (content similarity)
 * - تشابه الكاتيجوري
 * - الكلمات المفتاحية المشتركة
 * - الـ entities المشتركة
 *
 * يحسن:
 * - SEO (internal links = PageRank flow)
 * - User engagement (مقالات ذات صلة)
 * - Bounce rate reduction
 */

import { db } from '@/lib/db'

export interface InternalLink {
  articleId: string
  articleSlug: string
  articleTitle: string
  relevanceScore: number  // 0-100
  reason: string
}

export interface InternalLinkResult {
  links: InternalLink[]
  keywordsLinked: string[]
}

/**
 * يجد أفضل المقالات للربط الداخلي.
 */
export async function findInternalLinks(
  currentArticleId: string,
  title: string,
  body: string,
  keywords: string,
  categoryId: string,
  maxLinks: number = 5
): Promise<InternalLinkResult> {
  // Get candidate articles (same category, published, not current)
  const candidates = await db.article.findMany({
    where: {
      status: 'published',
      NOT: { id: currentArticleId },
      OR: [
        { categoryId },  // Same category
        { seoKeywords: { contains: keywords.split(',')[0] || '' } },  // Shared keyword
      ],
    },
    orderBy: { publishedAt: 'desc' },
    take: 50,
    select: {
      id: true,
      slug: true,
      titleAr: true,
      leadAr: true,
      bodyAr: true,
      seoKeywords: true,
      categoryId: true,
      publishedAt: true,
    },
  })

  if (candidates.length === 0) {
    return { links: [], keywordsLinked: [] }
  }

  // Score each candidate
  const currentKeywords = new Set(
    (keywords || '').split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
  )
  const currentTitleWords = new Set(
    title.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  )

  const scored = candidates.map(article => {
    let score = 0
    const reasons: string[] = []

    // Same category (+30)
    if (article.categoryId === categoryId) {
      score += 30
      reasons.push('نفس القسم')
    }

    // Shared keywords (+15 each, max 45)
    const articleKeywords = new Set(
      (article.seoKeywords || '').split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
    )
    const sharedKeywords = [...currentKeywords].filter(k => articleKeywords.has(k))
    score += Math.min(45, sharedKeywords.length * 15)
    if (sharedKeywords.length > 0) {
      reasons.push(`${sharedKeywords.length} كلمات مفتاحية مشتركة`)
    }

    // Title word overlap (+5 each, max 25)
    const articleTitleWords = new Set(
      article.titleAr.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    )
    const sharedTitleWords = [...currentTitleWords].filter(w => articleTitleWords.has(w))
    score += Math.min(25, sharedTitleWords.length * 5)

    // Body similarity (SimHash-style - simplified)
    const bodySim = quickBodySimilarity(body, article.bodyAr)
    score += Math.round(bodySim * 0.3)  // Max 30
    if (bodySim > 50) {
      reasons.push('محتوى مشابه')
    }

    // Recency bonus (newer = better)
    const ageDays = (Date.now() - article.publishedAt!.getTime()) / (1000 * 60 * 60 * 24)
    if (ageDays < 7) score += 10
    else if (ageDays < 30) score += 5

    return {
      articleId: article.id,
      articleSlug: article.slug,
      articleTitle: article.titleAr,
      relevanceScore: Math.min(100, score),
      reason: reasons.join('، ') || 'ذو صلة',
    }
  })

  // Sort by score and return top N
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore)
  const topLinks = scored.slice(0, maxLinks).filter(l => l.relevanceScore > 20)

  return {
    links: topLinks,
    keywordsLinked: [...currentKeywords].slice(0, 5),
  }
}

/**
 * Quick body similarity using word frequency.
 */
function quickBodySimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 4))
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 4))
  if (wordsA.size === 0 || wordsB.size === 0) return 0
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)))
  const union = new Set([...wordsA, ...wordsB])
  return (intersection.size / union.size) * 100
}
