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
import { isAdContent } from '@/lib/content-filter'

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

  // 0. CONTENT FILTER - Skip ads, CTAs, promotional content
  const adCheck = isAdContent(item.title, item.summary, item.content || '', item.link)
  if (adCheck.isAd) {
    await logStage('content_filter', 'success',
      `SKIPPED ad/CTA content: "${item.title.slice(0, 50)}..." (score: ${adCheck.score})`,
      { reason: adCheck.reason, score: adCheck.score, link: item.link },
    )
    return  // Skip this item entirely
  }

  // 1. AI Rewrite (with error handling → manual review queue)
  const rewriteStart = Date.now()
  let rewritten
  let aiFailed = false
  try {
    rewritten = await rewriteArticle(item, {
      tone: source.aiTone as AiTone,
      length: source.aiLength as AiLength,
      outputLang: source.language as any || 'ar',
      siteName,
      categoryName: source.category?.nameAr,
    })

    // Check if AI actually rewrote or just used fallback
    if (rewritten.model === 'fallback') {
      aiFailed = true
      await logStage('ai_rewrite', 'error',
        `AI rewrite failed (fallback used) for: ${item.title.slice(0, 40)}... → routing to manual review`,
        { source: item.link },
        Date.now() - rewriteStart
      )
    } else {
      await logStage('ai_rewrite', 'success',
        `${item.title.slice(0, 50)}... → ${rewritten.titleAr.slice(0, 50)}... (quality: ${rewritten.qualityScore}%, plagiarism: ${rewritten.plagiarismScore}%)`,
        { qualityScore: rewritten.qualityScore, plagiarismScore: rewritten.plagiarismScore, humanScore: rewritten.humanScore },
        Date.now() - rewriteStart
      )
    }
  } catch (e: any) {
    // AI rewrite crashed completely → create draft with original content for manual review
    aiFailed = true
    await logStage('ai_rewrite', 'error',
      `AI rewrite crashed: ${e.message} → routing to manual review`,
      { source: item.link, error: e.message },
      Date.now() - rewriteStart
    )
    // Use a minimal fallback so the article is still created for manual editing
    rewritten = {
      titleAr: item.title,
      titleEn: item.title,
      leadAr: item.summary,
      leadEn: item.summary,
      bodyAr: item.content || item.summary || item.title,
      bodyEn: '',
      excerpt: item.summary?.slice(0, 160) || '',
      seoTitle: item.title.slice(0, 60),
      seoDescription: (item.summary || '').slice(0, 160),
      seoKeywords: '',
      tags: [],
      plagiarismScore: 100,
      humanScore: 0,
      qualityScore: 0,
      model: 'failed',
    }
  }

  // 2. Semantic Verification (Hallucination detection)
  // يجمع: fact-check + claim extraction + AI verification
  let verificationResult: any = null
  try {
    const { verifyArticle } = await import('@/lib/semantic-verify')
    verificationResult = await verifyArticle(
      item.content || item.summary || '',
      item.title,
      rewritten.bodyAr,
      rewritten.titleAr
    )

    if (verificationResult.needsManualReview) {
      aiFailed = true  // Route to manual review
      await logStage('semantic_verify', 'error',
        `Verification ${verificationResult.status} (confidence: ${verificationResult.confidence}%) for: ${rewritten.titleAr.slice(0, 40)}...`,
        {
          status: verificationResult.status,
          confidence: verificationResult.confidence,
          recommendations: verificationResult.recommendations.slice(0, 3),
          hallucinations: verificationResult.aiVerification ? {
            addedDetails: verificationResult.aiVerification.addedDetails.length,
            alteredQuotes: verificationResult.aiVerification.alteredQuotes.length,
            unsupportedClaims: verificationResult.aiVerification.unsupportedClaims.length,
          } : null,
        },
      )
    } else {
      await logStage('semantic_verify', 'success',
        `Verification ${verificationResult.status} (confidence: ${verificationResult.confidence}%)`,
        { status: verificationResult.status, confidence: verificationResult.confidence },
      )
    }
  } catch (e: any) {
    await logStage('semantic_verify', 'error', e.message)
    // Non-fatal - continue without verification
  }

  // 3. Generate slug - ensure clean, readable URL
  const slugBase = (rewritten.titleEn || rewritten.titleAr || item.title)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')  // Remove special chars (keep word chars, spaces, hyphens)
    .replace(/\s+/g, '-')      // Spaces to hyphens
    .replace(/-+/g, '-')       // Multiple hyphens to single
    .replace(/^-|-$/g, '')     // Remove leading/trailing hyphens
    .slice(0, 70)              // Limit length
  const slug = slugBase + '-' + Date.now().toString(36)

  // 4. Determine status
  // - If AI failed OR fact-check failed → 'needs_review' (manual review queue)
  // - If autoPublish and no failures → 'published'
  // - Otherwise → 'draft'
  let status: string
  if (aiFailed) {
    status = 'needs_review'
  } else if (autoPublish) {
    status = 'published'
  } else {
    status = 'draft'
  }

  // 5. Create article
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
      author: 'Editorial Team',
      status,
      isBreaking: source.aiTone === 'breaking' && !aiFailed,
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
      factCheckNotes: verificationResult ? JSON.stringify({
        status: verificationResult.status,
        confidence: verificationResult.confidence,
        factCheckScore: verificationResult.factCheckResult?.score,
        claims: {
          total: verificationResult.claims?.length || 0,
          verified: verificationResult.claims?.filter((c: any) => c.verified).length || 0,
          unverified: verificationResult.claims?.filter((c: any) => !c.verified).length || 0,
        },
        hallucinations: verificationResult.aiVerification ? {
          addedDetails: verificationResult.aiVerification.addedDetails.length,
          alteredQuotes: verificationResult.aiVerification.alteredQuotes.length,
          meaningShift: verificationResult.aiVerification.meaningShift.length,
          unsupportedClaims: verificationResult.aiVerification.unsupportedClaims.length,
          assessment: verificationResult.aiVerification.overallAssessment,
        } : null,
        recommendations: verificationResult.recommendations?.slice(0, 5),
        needsManualReview: verificationResult.needsManualReview,
      }) : null,
    },
  })

  result.articlesCreated++
  if (status === 'published') result.articlesPublished++

  await logStage('publish', 'success',
    `Created article: ${rewritten.titleAr.slice(0, 50)}... (${status})`,
    { id: article.id, slug, status, factCheckScore: verificationResult?.factCheckResult?.score },
    0
  )

  // 6. Notify IndexNow for instant indexing (only for published articles)
  if (status === 'published') {
    try {
      const { notifyArticlePublished } = await import('@/lib/indexnow')
      await notifyArticlePublished(slug)
      await logStage('indexnow', 'success', `Submitted to IndexNow: ${slug}`)
    } catch (e: any) {
      await logStage('indexnow', 'error', e.message)
      // Don't fail the whole pipeline for IndexNow
    }
  }

  // 7. Process images (if enabled) - errors don't stop the pipeline
  if (source.includeImages && item.images.length > 0) {
    const imgStart = Date.now()
    try {
      // Try watermarking, but if it fails, just use original URLs
      let processedImages: any[] = []
      try {
        processedImages = await processImages(
          item.images,
          {
            siteName,
            position: 'bottom-right',
            opacity: 75,
            fontSize: 0.035,
            textColor: '#ffffff',
          },
          3
        )
      } catch (wmError: any) {
        // Watermarking failed (likely sharp on serverless) - use originals
        await logStage('image_process', 'error', `Watermarking failed: ${wmError.message} - using original URLs`)
      }

      // If watermarking produced results, save them
      if (processedImages.length > 0) {
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

        const featuredImg = processedImages[0].storedUrl || processedImages[0].originalUrl
        await db.article.update({
          where: { id: article.id },
          data: { featuredImg },
        })
      } else {
        // Use original image URLs directly (no watermarking)
        const originalImg = item.images[0]
        await db.article.update({
          where: { id: article.id },
          data: { featuredImg: originalImg },
        })
        await db.articleImage.create({
          data: {
            articleId: article.id,
            originalUrl: originalImg,
            storedUrl: originalImg,
            isFeatured: true,
            isWatermarked: false,
            order: 0,
          },
        })
        result.imagesProcessed++
      }

      await logStage('image_process', 'success',
        `Images set for: ${rewritten.titleAr.slice(0, 40)}... (${item.images.length} found)`,
        { count: item.images.length },
        Date.now() - imgStart
      )
    } catch (e: any) {
      // Image processing failure is non-fatal - article is still created
      await logStage('image_process', 'error', e.message, { article: article.id }, Date.now() - imgStart)
    }
  }

  // 6. Update source article count
  await db.rssSource.update({
    where: { id: source.id },
    data: { articlesCount: { increment: 1 } },
  })
}
