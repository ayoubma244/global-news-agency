/**
 * RSS Automation Pipeline
 * ===================================
 * 1. Fetch RSS sources (active only)
 * 2. Get new items (skip already processed URLs)
 * 3. For each new item:
 *    a. AI Rewrite (paraphrase + humanize)
 *    b. Process images (download + watermark with site name)
 *    c. Save article + images to DB
 *    d. Optionally publish
 *
 * Each stage logs to AutomationLog table.
 */

import { db } from '@/lib/db'
import { fetchRssFeed, getNewRssItems, type RssItem } from '@/lib/rss-parser'
import { rewriteArticle, type AiTone, type AiLength } from '@/lib/ai-rewriter'
import { processImages } from '@/lib/image-watermark'
import { getAllSettings } from '@/lib/settings'

// ===== Logging helper =====
export async function logStage(stage: string, status: string, message?: string, details?: any, durationMs?: number) {
  try {
    await db.automationLog.create({
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

// ===== Main Pipeline =====
export interface RssPipelineResult {
  sourcesProcessed: number
  itemsFound: number
  articlesCreated: number
  articlesPublished: number
  imagesProcessed: number
  errors: string[]
  durationMs: number
}

export async function runRssPipeline(opts: {
  sourceId?: string  // specific source only
  maxItemsPerSource?: number
  forcePublish?: boolean
} = {}): Promise<RssPipelineResult> {
  const startTotal = Date.now()
  const result: RssPipelineResult = {
    sourcesProcessed: 0,
    itemsFound: 0,
    articlesCreated: 0,
    articlesPublished: 0,
    imagesProcessed: 0,
    errors: [],
    durationMs: 0,
  }

  try {
    // Get settings
    const settings = await getAllSettings()
    const siteName = settings.site_name || 'وكالة الأنباء العالمية'

    // 1. Get active RSS sources
    const where: any = { isActive: true }
    if (opts.sourceId) where.id = opts.sourceId

    const sources = await db.rssSource.findMany({
      where,
      include: { category: true },
    })

    if (sources.length === 0) {
      result.errors.push('لا توجد مصادر RSS نشطة')
      result.durationMs = Date.now() - startTotal
      return result
    }

    const maxItems = opts.maxItemsPerSource || 3

    // 2. Process each source
    for (const source of sources) {
      const sourceStart = Date.now()
      try {
        // Fetch feed
        const feed = await fetchRssFeed(source.url)
        const newItems = await getNewRssItems(feed, maxItems)

        result.itemsFound += newItems.length
        result.sourcesProcessed++

        // Update source stats
        await db.rssSource.update({
          where: { id: source.id },
          data: {
            lastFetchedAt: new Date(),
            lastFetchStatus: 'success',
            lastError: null,
          },
        })

        await logStage('rss_fetch', 'success',
          `${source.name}: ${newItems.length} عناصر جديدة (${feed.items.length} إجمالي)`,
          { source: source.name, newItems: newItems.length, total: feed.items.length },
          Date.now() - sourceStart
        )

        // 3. Process each new item
        for (const item of newItems) {
          try {
            await processItem(item, source, siteName, opts.forcePublish ?? source.autoPublish, result)
          } catch (e: any) {
            result.errors.push(`${source.name}: ${item.title.slice(0, 40)}... - ${e.message}`)
            await logStage('process_item', 'error', e.message, { source: source.name, item: item.link })
          }
        }
      } catch (e: any) {
        result.errors.push(`${source.name}: ${e.message}`)
        await db.rssSource.update({
          where: { id: source.id },
          data: {
            lastFetchedAt: new Date(),
            lastFetchStatus: 'error',
            lastError: e.message,
          },
        })
        await logStage('rss_fetch', 'error', `${source.name}: ${e.message}`, { source: source.name })
      }
    }

    result.durationMs = Date.now() - startTotal
    await logStage('rss_pipeline', 'success',
      `Pipeline complete: ${result.articlesCreated}/${result.itemsFound} articles, ${result.imagesProcessed} images, ${result.durationMs}ms`,
      result,
      result.durationMs
    )

    return result
  } catch (e: any) {
    result.errors.push(`Pipeline error: ${e.message}`)
    result.durationMs = Date.now() - startTotal
    return result
  }
}

// ===== Process Single Item =====
async function processItem(
  item: RssItem,
  source: any,
  siteName: string,
  autoPublish: boolean,
  result: RssPipelineResult
) {
  // Determine category - use source's category, or find first active category
  let categoryId = source.categoryId
  if (!categoryId) {
    const fallbackCat = await db.category.findFirst({
      where: { level: 1, isActive: true },
      orderBy: { order: 'asc' },
    })
    categoryId = fallbackCat?.id
  }
  if (!categoryId) {
    throw new Error('No category available')
  }
  // 1. AI Rewrite
  const rewriteStart = Date.now()
  const rewritten = await rewriteArticle(item, {
    tone: source.aiTone as AiTone,
    length: source.aiLength as AiLength,
    outputLang: source.language as any || 'ar',
    siteName,
    categoryName: source.category?.nameAr,
  })

  await logStage('ai_rewrite', 'success',
    `${item.title.slice(0, 50)}... → ${rewritten.titleAr.slice(0, 50)}... (quality: ${rewritten.qualityScore}%, plagiarism: ${rewritten.plagiarismScore}%)`,
    { qualityScore: rewritten.qualityScore, plagiarismScore: rewritten.plagiarismScore, humanScore: rewritten.humanScore },
    Date.now() - rewriteStart
  )

  // 2. Generate slug
  const slug = (rewritten.titleEn || rewritten.titleAr)
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80) + '-' + Date.now().toString(36)

  // 3. Determine status
  const status = autoPublish ? 'published' : 'draft'

  // 4. Create article
  const article = await db.article.create({
    data: {
      slug,
      titleAr: rewritten.titleAr,
      titleEn: rewritten.titleEn,
      leadAr: rewritten.leadAr,
      leadEn: rewritten.leadEn,
      bodyAr: rewritten.bodyAr,
      bodyEn: rewritten.bodyEn,
      excerpt: rewritten.excerpt,
      categoryId: categoryId,
      sourceUrl: item.link,
      sourceName: source.siteName || source.name,
      author: 'Automated System',
      status,
      isBreaking: source.aiTone === 'breaking',
      isFeatured: false,
      seoTitle: rewritten.seoTitle,
      seoDescription: rewritten.seoDescription,
      seoKeywords: rewritten.seoKeywords,
      publishedAt: status === 'published' ? new Date() : null,
      rssSourceId: source.id,
      aiToneUsed: source.aiTone,
      aiLengthUsed: source.aiLength,
      aiModel: rewritten.model,
      plagiarismScore: rewritten.plagiarismScore,
      humanScore: rewritten.humanScore,
    },
  })

  result.articlesCreated++
  if (status === 'published') result.articlesPublished++

  await logStage('publish', 'success',
    `Created article: ${rewritten.titleAr.slice(0, 50)}... (${status})`,
    { id: article.id, slug, status },
    0
  )

  // 5. Process images (if enabled)
  if (source.includeImages && item.images.length > 0) {
    const imgStart = Date.now()
    try {
      const processedImages = await processImages(
        item.images,
        {
          siteName,
          position: 'bottom-right',
          opacity: 75,
          fontSize: 0.035,
          textColor: '#ffffff',
        },
        5
      )

      // Save image records + set featured image
      for (let i = 0; i < processedImages.length; i++) {
        const img = processedImages[i]
        await db.articleImage.create({
          data: {
            articleId: article.id,
            originalUrl: img.originalUrl,
            storedUrl: img.storedUrl,
            width: img.width,
            height: img.height,
            isFeatured: i === 0,
            isWatermarked: img.isWatermarked,
            order: i,
          },
        })
        result.imagesProcessed++
      }

      // Set featured image on article
      if (processedImages.length > 0) {
        await db.article.update({
          where: { id: article.id },
          data: { featuredImg: processedImages[0].storedUrl },
        })
      }

      await logStage('image_process', 'success',
        `${processedImages.length}/${item.images.length} images processed for: ${rewritten.titleAr.slice(0, 40)}...`,
        { count: processedImages.length },
        Date.now() - imgStart
      )
    } catch (e: any) {
      await logStage('image_process', 'error', e.message, { article: article.id }, Date.now() - imgStart)
    }
  }

  // 6. Update source article count
  await db.rssSource.update({
    where: { id: source.id },
    data: { articlesCount: { increment: 1 } },
  })
}
