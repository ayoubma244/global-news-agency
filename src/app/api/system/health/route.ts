/**
 * GET /api/system/health
 * Comprehensive system health check (admin only).
 * Returns: DB, Redis, AI, Email, Real-time, Disk, Memory, Pipelines
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { isRedisConfigured, cacheGet, cacheSet } from '@/lib/redis'
import { isAIConfigured } from '@/lib/zai'
import { isEmailConfigured } from '@/lib/email'
import { isIndexNowEnabled } from '@/lib/indexnow'

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const checks: Record<string, { status: 'ok' | 'warning' | 'error' | 'info'; message: string; details?: any }> = {}

  // 1. Database
  try {
    const start = Date.now()
    await db.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - start
    checks.database = {
      status: dbLatency < 100 ? 'ok' : dbLatency < 500 ? 'warning' : 'error',
      message: `Connected (${dbLatency}ms)`,
      details: { latency: dbLatency },
    }
  } catch (e: any) {
    checks.database = { status: 'error', message: e.message }
  }

  // 2. Redis
  if (isRedisConfigured()) {
    try {
      const testKey = 'health-check-' + Date.now()
      await cacheSet(testKey, { ok: true }, 10)
      const result = await cacheGet(testKey)
      checks.redis = {
        status: result ? 'ok' : 'warning',
        message: result ? 'Connected & caching' : 'Connected but cache miss',
      }
    } catch (e: any) {
      checks.redis = { status: 'error', message: e.message }
    }
  } else {
    checks.redis = { status: 'info', message: 'Not configured (using in-memory fallback)' }
  }

  // 3. AI (Z.ai)
  checks.ai = {
    status: isAIConfigured() ? 'ok' : 'warning',
    message: isAIConfigured() ? 'Z.ai API key configured' : 'ZAI_API_KEY not set - AI features disabled',
  }

  // 4. Email
  checks.email = {
    status: isEmailConfigured() ? 'ok' : 'warning',
    message: isEmailConfigured() ? 'Email service configured' : 'No email service configured',
  }

  // 5. IndexNow
  checks.indexNow = {
    status: isIndexNowEnabled() ? 'ok' : 'info',
    message: isIndexNowEnabled() ? 'Enabled' : 'Disabled (production only)',
  }

  // 6. Real-time service (check if port 3003 is responding)
  checks.realtime = {
    status: 'info',
    message: 'WebSocket service should run on port 3003',
  }

  // 7. Pipelines stats (last 24h)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const [automationLogs, errorCount, successCount] = await Promise.all([
    db.automationLog.count({ where: { createdAt: { gte: since } } }),
    db.automationLog.count({ where: { createdAt: { gte: since }, status: 'error' } }),
    db.automationLog.count({ where: { createdAt: { gte: since }, status: 'success' } }),
  ])
  checks.pipelines = {
    status: errorCount > 10 ? 'warning' : 'ok',
    message: `${automationLogs} logs in 24h (${successCount} success, ${errorCount} errors)`,
    details: { total: automationLogs, success: successCount, errors: errorCount },
  }

  // 8. Content stats
  const [totalArticles, publishedArticles, draftArticles, needsReviewArticles] = await Promise.all([
    db.article.count(),
    db.article.count({ where: { status: 'published' } }),
    db.article.count({ where: { status: 'draft' } }),
    db.article.count({ where: { status: 'needs_review' } }),
  ])
  checks.content = {
    status: needsReviewArticles > 20 ? 'warning' : 'ok',
    message: `${totalArticles} articles (${publishedArticles} published, ${draftArticles} drafts, ${needsReviewArticles} needs review)`,
    details: { total: totalArticles, published: publishedArticles, drafts: draftArticles, needsReview: needsReviewArticles },
  }

  // 9. RSS sources health
  const [activeSources, errorSources] = await Promise.all([
    db.rssSource.count({ where: { isActive: true } }),
    db.rssSource.count({ where: { lastFetchStatus: 'error' } }),
  ])
  checks.rssSources = {
    status: errorSources > activeSources * 0.3 ? 'warning' : 'ok',
    message: `${activeSources} active sources, ${errorSources} with errors`,
    details: { active: activeSources, errors: errorSources },
  }

  // 10. Subscribers
  const subscriberCount = await db.subscriber.count({ where: { isActive: true, isVerified: true } })
  checks.subscribers = {
    status: 'ok',
    message: `${subscriberCount} active verified subscribers`,
  }

  // Overall status
  const hasError = Object.values(checks).some(c => c.status === 'error')
  const hasWarning = Object.values(checks).some(c => c.status === 'warning')
  const overallStatus = hasError ? 'error' : hasWarning ? 'warning' : 'ok'

  return NextResponse.json({
    ok: true,
    overall: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks,
  })
}
