/**
 * Personalized Feed & Recommendations Engine
 * Recommends articles based on:
 * - Reading history (categories viewed)
 * - Bookmarks
 * - Reactions (liked/loved)
 * - Trending (popular today)
 * - Fresh (newest)
 *
 * Uses weighted scoring algorithm (no ML library needed).
 */

import { db } from '@/lib/db'

export interface RecommendedArticle {
  id: string
  slug: string
  titleAr: string
  leadAr: string | null
  featuredImg: string | null
  publishedAt: Date
  views: number
  category: { id: string; nameAr: string; icon: string; slug: string }
  score: number
  reason: string
}

/**
 * Get personalized feed for a user session.
 */
export async function getPersonalizedFeed(sessionId: string, limit: number = 20): Promise<RecommendedArticle[]> {
  // 1. Build user profile from history + bookmarks + reactions
  const [history, bookmarks, reactions] = await Promise.all([
    db.readingHistory.findMany({
      where: { sessionId },
      take: 50,
      orderBy: { viewedAt: 'desc' },
      include: { article: { select: { categoryId: true } } },
    }),
    db.bookmark.findMany({
      where: { sessionId },
      include: { article: { select: { categoryId: true } } },
    }),
    db.reaction.findMany({
      where: { sessionId },
      include: { article: { select: { categoryId: true } } },
    }),
  ])

  // 2. Calculate category preferences (weighted)
  const categoryScores = new Map<string, number>()

  // Reading history: weight 1, recency decay
  history.forEach((h, i) => {
    const cat = h.article?.categoryId
    if (cat) {
      const decay = 1 - (i / history.length) * 0.5  // newer = higher weight
      categoryScores.set(cat, (categoryScores.get(cat) || 0) + decay)
    }
  })

  // Bookmarks: weight 3 (strong signal)
  bookmarks.forEach(b => {
    const cat = b.article?.categoryId
    if (cat) categoryScores.set(cat, (categoryScores.get(cat) || 0) + 3)
  })

  // Reactions: weight 2 (medium signal)
  reactions.forEach(r => {
    const cat = r.article?.categoryId
    if (cat) categoryScores.set(cat, (categoryScores.get(cat) || 0) + 2)
  })

  // 3. Get candidate articles (published, not read before)
  const readArticleIds = new Set(history.map(h => h.articleId))
  const candidates = await db.article.findMany({
    where: {
      status: 'published',
      NOT: { id: { in: Array.from(readArticleIds) } },
    },
    orderBy: { publishedAt: 'desc' },
    take: 100,
    include: { category: { select: { id: true, nameAr: true, icon: true, slug: true } } },
  })

  // 4. Score each article
  const scored: RecommendedArticle[] = candidates.map(article => {
    let score = 0
    const reasons: string[] = []

    // Category match (user preference)
    const catScore = categoryScores.get(article.categoryId) || 0
    if (catScore > 0) {
      score += catScore * 10
      reasons.push(`يعجبك ${article.category.nameAr}`)
    }

    // Recency (newer = better, decay over 7 days)
    const ageHours = (Date.now() - article.publishedAt!.getTime()) / (1000 * 60 * 60)
    if (ageHours < 1) { score += 50; reasons.push('جديد جداً') }
    else if (ageHours < 6) { score += 30; reasons.push('حديث') }
    else if (ageHours < 24) { score += 15 }
    else if (ageHours < 168) { score += 5 }
    else { score -= 5 } // penalize old articles

    // Popularity (views in last 24h)
    if (article.views > 1000) { score += 20; reasons.push('رائج') }
    else if (article.views > 100) { score += 10 }
    else if (article.views > 10) { score += 3 }

    // Breaking news bonus
    if (article.isBreaking) { score += 15; reasons.push('عاجل') }

    // Featured bonus
    if (article.isFeatured) { score += 10; reasons.push('مميز') }

    // Random factor to diversify (avoid showing same articles)
    score += Math.random() * 5

    return {
      id: article.id,
      slug: article.slug,
      titleAr: article.titleAr,
      leadAr: article.leadAr,
      featuredImg: article.featuredImg,
      publishedAt: article.publishedAt!,
      views: article.views,
      category: article.category,
      score,
      reason: reasons[0] || 'مقترح لك',
    }
  })

  // 5. Sort by score and return top N
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit)
}

/**
 * Get related articles for a specific article (similar category + tags).
 */
export async function getRelatedArticles(articleId: string, limit: number = 6): Promise<RecommendedArticle[]> {
  const article = await db.article.findUnique({
    where: { id: articleId },
    select: { categoryId: true, seoKeywords: true, tags: true },
  })

  if (!article) return []

  // Same category articles (excluding current)
  const related = await db.article.findMany({
    where: {
      categoryId: article.categoryId,
      status: 'published',
      NOT: { id: articleId },
    },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    include: { category: { select: { id: true, nameAr: true, icon: true, slug: true } } },
  })

  return related.map(a => ({
    id: a.id,
    slug: a.slug,
    titleAr: a.titleAr,
    leadAr: a.leadAr,
    featuredImg: a.featuredImg,
    publishedAt: a.publishedAt!,
    views: a.views,
    category: a.category,
    score: 0,
    reason: 'ذو صلة',
  }))
}
