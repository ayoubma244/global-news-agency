/**
 * IndexNow API Integration
 * Notifies Bing/Yandex/Naver of new/updated URLs for instant indexing.
 * Free service - no API key required for most providers.
 *
 * Docs: https://www.indexnow.org/documentation
 */

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || generateKey()
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow'
const BING_ENDPOINT = 'https://www.bing.com/indexnow'
const YANDEX_ENDPOINT = 'https://yandex.com/indexnow'

// Generate a simple key if not set (should be set in production)
function generateKey(): string {
  return Array.from({ length: 32 }, () =>
    'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
  ).join('')
}

export interface IndexNowResult {
  ok: boolean
  submitted: number
  errors: string[]
}

/**
 * Submit URLs to IndexNow for instant indexing.
 * Sends to 3 endpoints: IndexNow, Bing, Yandex.
 */
export async function submitToIndexNow(urls: string[]): Promise<IndexNowResult> {
  if (urls.length === 0) {
    return { ok: true, submitted: 0, errors: [] }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const keyLocation = `${siteUrl}/${INDEXNOW_KEY}.txt`

  const body = {
    host: new URL(siteUrl).host,
    key: INDEXNOW_KEY,
    keyLocation,
    urlList: urls.slice(0, 10000), // Max 10,000 URLs per request
  }

  const endpoints = [INDEXNOW_ENDPOINT, BING_ENDPOINT, YANDEX_ENDPOINT]
  const errors: string[] = []
  let successCount = 0

  // Send to all endpoints in parallel
  const results = await Promise.allSettled(
    endpoints.map(endpoint =>
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      })
    )
  )

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      if (result.value.ok || result.value.status === 200 || result.value.status === 202) {
        successCount++
      } else {
        errors.push(`${endpoints[i]}: HTTP ${result.value.status}`)
      }
    } else {
      errors.push(`${endpoints[i]}: ${result.reason?.message}`)
    }
  })

  return {
    ok: successCount > 0,
    submitted: urls.length,
    errors,
  }
}

/**
 * Submit a single article URL to IndexNow.
 */
export async function notifyArticlePublished(slug: string): Promise<IndexNowResult> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const url = `${siteUrl}/article/${slug}`
  return submitToIndexNow([url])
}

/**
 * Submit multiple article URLs (batch).
 */
export async function notifyBatchPublished(slugs: string[]): Promise<IndexNowResult> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const urls = slugs.map(slug => `${siteUrl}/article/${slug}`)
  return submitToIndexNow(urls)
}

/**
 * Get the IndexNow key (for creating the key file).
 */
export function getIndexNowKey(): string {
  return INDEXNOW_KEY
}

/**
 * Check if IndexNow is enabled.
 */
export function isIndexNowEnabled(): boolean {
  // Always enabled (key is auto-generated), but only useful in production
  return process.env.NODE_ENV === 'production' || !!process.env.INDEXNOW_KEY
}
