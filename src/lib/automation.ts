/**
 * Automation Pipeline — 7 stages
 * ===================================
 * 1. Trend Discovery     — find trending topics
 * 2. Source Aggregation  — fetch articles from NewsAPI/RSS
 * 3. AI Rewriter         — paraphrase with Z.ai
 * 4. Fact-Check          — verify claims
 * 5. SEO Optimization    — meta tags, schema, keywords
 * 6. Publishing          — save to DB
 * 7. Distribution        — share to social
 *
 * Each stage logs to AutomationLog table.
 */

import { PrismaClient } from '@prisma/client'
import { getZAI, isAIConfigured } from '@/lib/zai'

const prisma = new PrismaClient()

// ===== Types =====
export interface TrendItem {
  topic: string
  score: number
  source: 'google_trends' | 'twitter' | 'reddit' | 'manual'
  category?: string
  url?: string
}

export interface SourceArticle {
  title: string
  url: string
  source: string
  publishedAt: string
  content: string
  summary?: string
  imageUrl?: string
  category?: string
}

export interface RewrittenArticle {
  titleAr: string
  titleEn: string
  leadAr: string
  leadEn: string
  bodyAr: string
  bodyEn: string
  excerpt: string
  seoKeywords: string
  seoTitle: string
  seoDescription: string
  factCheckStatus: 'verified' | 'unverified' | 'failed'
  factCheckNotes?: string
  imageUrl?: string
}

// ===== Logging helper =====
export async function logStage(stage: string, status: string, message?: string, details?: any, durationMs?: number) {
  try {
    await prisma.automationLog.create({
      data: {
        stage,
        status,
        message: message || null,
        details: details ? JSON.stringify(details) : null,
        durationMs: durationMs || null,
      },
    })
  } catch (e) {
    console.error('Failed to log stage:', e)
  }
}

// ===== Stage 1: Trend Discovery =====
export async function discoverTrends(opts?: { categories?: string[]; limit?: number }): Promise<TrendItem[]> {
  const start = Date.now()
  const limit = opts?.limit || 10
  const trends: TrendItem[] = []

  try {
    // Use Z.ai chat with web_search function to find trending topics
    if (isAIConfigured()) {
      const zai = getZAI()
      const prompt = `Find the top ${limit} trending news topics right now globally. Return ONLY a JSON array of objects with "topic" (string), "category" (one of: world-news, politics, economy, technology, sports, entertainment, health, environment, education, weather, crypto), and "score" (1-100). Categories: ${opts?.categories?.join(', ') || 'all'}.`

      const response = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a news trend analyst. Respond only with valid JSON.' },
          { role: 'user', content: prompt },
        ],
      })

      const content = response?.choices?.[0]?.message?.content || '[]'
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        for (const item of parsed) {
          trends.push({
            topic: item.topic,
            score: item.score || 50,
            source: 'google_trends',
            category: item.category,
          })
        }
      }
    }

    // If AI didn't return anything, use RSS-based fallback
    if (trends.length === 0) {
      // Use Google News RSS as fallback (always works)
      const googleNewsRss = 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en'
      try {
        const res = await fetch(googleNewsRss, { signal: AbortSignal.timeout(10000) })
        const xml = await res.text()
        const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
        for (let i = 0; i < Math.min(items.length, limit); i++) {
          const item = items[i]
          const title = item.match(/<title>(.*?)<\/title>/)?.[1] || ''
          const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
          if (title) {
            trends.push({
              topic: title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
              score: 100 - i * 5,
              source: 'google_trends',
              url: link,
            })
          }
        }
      } catch (e) {
        console.error('RSS fallback failed:', e)
      }
    }

    await logStage('trend_discovery', 'success', `Discovered ${trends.length} trends`, { count: trends.length }, Date.now() - start)
    return trends
  } catch (e: any) {
    await logStage('trend_discovery', 'error', e.message, { error: e.message }, Date.now() - start)
    throw e
  }
}

// ===== Stage 2: Source Aggregation =====
export async function aggregateSources(trend: TrendItem): Promise<SourceArticle[]> {
  const start = Date.now()
  const articles: SourceArticle[] = []

  try {
    // Try Z.ai web search first
    if (isAIConfigured()) {
      const zai = getZAI()
      const response = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a news aggregator. Find real, recent news articles about the given topic. Return ONLY a JSON array of objects with "title", "url", "source", "publishedAt" (ISO date), "summary" (2-3 sentences), and "category".',
          },
          {
            role: 'user',
            content: `Find 3 recent news articles about: "${trend.topic}". Category: ${trend.category || 'general'}.`,
          },
        ],
      })

      const content = response?.choices?.[0]?.message?.content || '[]'
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        for (const item of parsed) {
          articles.push({
            title: item.title,
            url: item.url,
            source: item.source || 'web',
            publishedAt: item.publishedAt || new Date().toISOString(),
            content: item.summary || '',
            summary: item.summary,
            category: item.category || trend.category,
          })
        }
      }
    }

    // If still empty, use Google News RSS as fallback for the trend topic
    if (articles.length === 0) {
      const encodedTopic = encodeURIComponent(trend.topic)
      const rssUrl = `https://news.google.com/rss/search?q=${encodedTopic}&hl=en-US&gl=US&ceid=US:en`
      try {
        const res = await fetch(rssUrl, { signal: AbortSignal.timeout(10000) })
        const xml = await res.text()
        const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
        for (let i = 0; i < Math.min(items.length, 3); i++) {
          const item = items[i]
          const title = item.match(/<title>(.*?)<\/title>/)?.[1] || ''
          const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
          const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
          const source = item.match(/<source[^>]*>(.*?)<\/source>/)?.[1] || 'Google News'
          if (title) {
            articles.push({
              title: decodeXmlEntities(title),
              url: link,
              source,
              publishedAt: pubDate || new Date().toISOString(),
              content: '',
              summary: decodeXmlEntities(title),
              category: trend.category,
            })
          }
        }
      } catch (e) {
        console.error('RSS aggregation failed:', e)
      }
    }

    await logStage('source_aggregation', 'success', `Aggregated ${articles.length} sources for: ${trend.topic}`, { topic: trend.topic, count: articles.length }, Date.now() - start)
    return articles
  } catch (e: any) {
    await logStage('source_aggregation', 'error', e.message, { topic: trend.topic, error: e.message }, Date.now() - start)
    throw e
  }
}

// ===== Stage 3: AI Rewriter =====
export async function rewriteArticle(source: SourceArticle, targetLang: 'ar' | 'en' = 'ar'): Promise<RewrittenArticle> {
  const start = Date.now()

  try {
    if (!isAIConfigured()) {
      // Fallback: just use source as-is
      const result: RewrittenArticle = {
        titleAr: targetLang === 'ar' ? source.title : source.title,
        titleEn: source.title,
        leadAr: source.summary || source.title,
        leadEn: source.summary || source.title,
        bodyAr: source.content || source.summary || source.title,
        bodyEn: source.content || source.summary || source.title,
        excerpt: (source.summary || source.title).slice(0, 160),
        seoKeywords: source.category || 'news',
        seoTitle: source.title.slice(0, 60),
        seoDescription: (source.summary || source.title).slice(0, 160),
        factCheckStatus: 'unverified',
        imageUrl: source.imageUrl,
      }
      await logStage('ai_rewriter', 'success', 'AI not configured, using source as-is (fallback)', { source: source.url }, Date.now() - start)
      return result
    }

    const zai = getZAI()
    const prompt = `You are a professional news editor for a global Arabic news agency. Rewrite the following news article in your own words.

SOURCE ARTICLE:
Title: ${source.title}
Source: ${source.source}
URL: ${source.url}
Content: ${source.content || source.summary || 'No content available, use the title and your knowledge of the topic'}

REQUIREMENTS:
1. Write in formal Arabic (MSA - فصحى)
2. Generate a compelling title (50-80 chars)
3. Write a strong lead paragraph (2-3 sentences, 100-150 chars)
4. Write a complete article body (400-600 words, divided into 3-5 paragraphs)
5. Generate an excerpt (max 160 chars)
6. Generate SEO title (max 60 chars), SEO description (max 160 chars), and 5 SEO keywords
7. Provide English title and lead translation
8. Maintain journalistic neutrality
9. Do NOT plagiarize - completely rewrite in your own words
10. Include source attribution in the body

Return ONLY valid JSON with this exact structure:
{
  "titleAr": "...",
  "titleEn": "...",
  "leadAr": "...",
  "leadEn": "...",
  "bodyAr": "paragraph1\\n\\nparagraph2\\n\\nparagraph3...",
  "bodyEn": "...",
  "excerpt": "...",
  "seoTitle": "...",
  "seoDescription": "...",
  "seoKeywords": "kw1, kw2, kw3, kw4, kw5"
}`

    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an expert Arabic news editor. Always respond with valid JSON only, no markdown.' },
        { role: 'user', content: prompt },
      ],
    })

    const content = response?.choices?.[0]?.message?.content || '{}'
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    const result: RewrittenArticle = {
      titleAr: parsed.titleAr || source.title,
      titleEn: parsed.titleEn || source.title,
      leadAr: parsed.leadAr || source.summary || '',
      leadEn: parsed.leadEn || source.summary || '',
      bodyAr: parsed.bodyAr || source.content || source.summary || '',
      bodyEn: parsed.bodyEn || '',
      excerpt: parsed.excerpt || (source.summary || source.title).slice(0, 160),
      seoTitle: parsed.seoTitle || source.title.slice(0, 60),
      seoDescription: parsed.seoDescription || (source.summary || source.title).slice(0, 160),
      seoKeywords: parsed.seoKeywords || source.category || 'news',
      factCheckStatus: 'unverified',
      imageUrl: source.imageUrl,
    }

    await logStage('ai_rewriter', 'success', `Rewrote: ${result.titleAr.slice(0, 50)}...`, { title: result.titleAr, source: source.url }, Date.now() - start)
    return result
  } catch (e: any) {
    await logStage('ai_rewriter', 'error', e.message, { source: source.url, error: e.message }, Date.now() - start)
    throw e
  }
}

// ===== Stage 4: Fact-Check =====
export async function factCheckArticle(article: RewrittenArticle, sourceUrl?: string): Promise<{ status: 'verified' | 'unverified' | 'failed'; notes?: string }> {
  const start = Date.now()

  try {
    if (!isAIConfigured()) {
      await logStage('fact_check', 'success', 'AI not configured, marking as unverified', {}, Date.now() - start)
      return { status: 'unverified', notes: 'AI not configured' }
    }

    const zai = getZAI()
    const prompt = `You are a fact-checker for a news agency. Analyze the following news article for accuracy and verifiability.

TITLE: ${article.titleAr}
LEAD: ${article.leadAr}
SOURCE URL: ${sourceUrl || 'N/A'}

Check for:
1. Are there any obviously false claims?
2. Are there unverifiable statistics?
3. Is the source reliable?
4. Are there red flags (sensationalism, missing context)?

Respond with ONLY JSON:
{
  "status": "verified" | "unverified" | "failed",
  "notes": "brief explanation"
}`

    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a fact-checker. Respond only with valid JSON.' },
        { role: 'user', content: prompt },
      ],
    })

    const content = response?.choices?.[0]?.message?.content || '{}'
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    const result = {
      status: parsed.status || 'unverified',
      notes: parsed.notes,
    }

    await logStage('fact_check', 'success', `Fact-check: ${result.status}`, result, Date.now() - start)
    return result
  } catch (e: any) {
    await logStage('fact_check', 'error', e.message, { error: e.message }, Date.now() - start)
    return { status: 'failed', notes: e.message }
  }
}

// ===== Stage 5: SEO Optimization =====
export async function optimizeSEO(article: RewrittenArticle): Promise<RewrittenArticle> {
  const start = Date.now()
  try {
    // Basic SEO optimizations (no AI needed)
    const optimized = { ...article }

    // Ensure SEO title is within 60 chars
    if (optimized.seoTitle.length > 60) {
      optimized.seoTitle = optimized.seoTitle.slice(0, 57) + '...'
    }
    // Ensure SEO description is within 160 chars
    if (optimized.seoDescription.length > 160) {
      optimized.seoDescription = optimized.seoDescription.slice(0, 157) + '...'
    }
    // Ensure excerpt
    if (!optimized.excerpt) {
      optimized.excerpt = optimized.leadAr.slice(0, 160)
    }

    await logStage('seo', 'success', 'SEO optimized', { title: optimized.seoTitle }, Date.now() - start)
    return optimized
  } catch (e: any) {
    await logStage('seo', 'error', e.message, { error: e.message }, Date.now() - start)
    return article
  }
}

// ===== Stage 6: Publishing =====
export async function publishArticle(
  article: RewrittenArticle,
  source: SourceArticle,
  categoryId: string,
  opts?: { autoPublish?: boolean; isBreaking?: boolean }
): Promise<{ id: string; slug: string }> {
  const start = Date.now()
  try {
    // Generate slug
    const slug = (article.titleEn || article.titleAr)
      .toLowerCase()
      .replace(/[^\w\u0600-\u06FF\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80) + '-' + Date.now().toString(36)

    const created = await prisma.article.create({
      data: {
        slug,
        titleAr: article.titleAr,
        titleEn: article.titleEn,
        leadAr: article.leadAr,
        leadEn: article.leadEn,
        bodyAr: article.bodyAr,
        bodyEn: article.bodyEn,
        excerpt: article.excerpt,
        featuredImg: article.imageUrl,
        categoryId,
        sourceUrl: source.url,
        sourceName: source.source,
        author: 'Automated System',
        status: opts?.autoPublish ? 'published' : 'draft',
        isBreaking: opts?.isBreaking || false,
        isFeatured: false,
        seoTitle: article.seoTitle,
        seoDescription: article.seoDescription,
        seoKeywords: article.seoKeywords,
        publishedAt: opts?.autoPublish ? new Date() : null,
      },
    })

    await logStage('publish', 'success', `Published: ${article.titleAr.slice(0, 50)}...`, { id: created.id, slug, status: created.status }, Date.now() - start)
    return { id: created.id, slug: created.slug }
  } catch (e: any) {
    await logStage('publish', 'error', e.message, { error: e.message }, Date.now() - start)
    throw e
  }
}

// ===== Stage 7: Distribution (stub) =====
export async function distributeArticle(articleId: string, slug: string): Promise<void> {
  const start = Date.now()
  try {
    // In production: post to Twitter, Facebook, Telegram, etc.
    // For now, just log
    await logStage('distribute', 'success', `Distribution stub for: ${slug}`, { articleId, slug }, Date.now() - start)
  } catch (e: any) {
    await logStage('distribute', 'error', e.message, { error: e.message }, Date.now() - start)
  }
}

// ===== Helper: Decode XML entities =====
function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
}

// ===== Main Pipeline Runner =====
export async function runPipeline(opts?: {
  trendsLimit?: number
  autoPublish?: boolean
  categoryId?: string
  manualTopic?: string
}): Promise<{
  trendsFound: number
  articlesProcessed: number
  articlesPublished: number
  errors: string[]
}> {
  const result = {
    trendsFound: 0,
    articlesProcessed: 0,
    articlesPublished: 0,
    errors: [] as string[],
  }

  try {
    // Stage 1: Discover trends
    let trends: TrendItem[] = []
    if (opts?.manualTopic) {
      trends = [{ topic: opts.manualTopic, score: 100, source: 'manual' }]
    } else {
      trends = await discoverTrends({ limit: opts?.trendsLimit || 5 })
    }
    result.trendsFound = trends.length

    // Stage 2-7: For each trend, aggregate, rewrite, fact-check, SEO, publish
    for (const trend of trends) {
      try {
        // Find best matching category
        let categoryId = opts?.categoryId
        if (!categoryId) {
          const allCats = await prisma.category.findMany({ where: { level: 1, isActive: true } })
          // Try to match by category hint
          if (trend.category) {
            const match = allCats.find(c => c.slug === trend.category || c.nameEn.toLowerCase().includes(trend.category!.toLowerCase()))
            if (match) categoryId = match.id
          }
          // Default to first category (world-news)
          if (!categoryId && allCats.length > 0) {
            categoryId = allCats[0].id
          }
        }

        if (!categoryId) {
          result.errors.push(`No category found for trend: ${trend.topic}`)
          continue
        }

        // Stage 2: Aggregate sources
        const sources = await aggregateSources(trend)
        if (sources.length === 0) {
          result.errors.push(`No sources for: ${trend.topic}`)
          continue
        }

        // Process first source only (to avoid duplicate content)
        const source = sources[0]

        // Stage 3: AI Rewrite
        const rewritten = await rewriteArticle(source, 'ar')

        // Stage 4: Fact-Check
        const factCheck = await factCheckArticle(rewritten, source.url)
        rewritten.factCheckStatus = factCheck.status
        rewritten.factCheckNotes = factCheck.notes

        // Skip if fact-check failed
        if (factCheck.status === 'failed') {
          result.errors.push(`Fact-check failed for: ${trend.topic}`)
          continue
        }

        // Stage 5: SEO
        const optimized = await optimizeSEO(rewritten)

        // Stage 6: Publish
        const published = await publishArticle(optimized, source, categoryId, {
          autoPublish: opts?.autoPublish,
          isBreaking: trend.score >= 90,
        })
        result.articlesProcessed++
        if (opts?.autoPublish) result.articlesPublished++

        // Stage 7: Distribute
        await distributeArticle(published.id, published.slug)

      } catch (e: any) {
        result.errors.push(`${trend.topic}: ${e.message}`)
      }
    }

    return result
  } catch (e: any) {
    result.errors.push(`Pipeline error: ${e.message}`)
    return result
  }
}
