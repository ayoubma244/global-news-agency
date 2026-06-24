/**
 * PostHog - Product Analytics
 * Tracks: page views, article reads, clicks, conversions.
 */

import { PostHog } from 'posthog-node'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

let client: PostHog | null = null

function getClient(): PostHog | null {
  if (!POSTHOG_KEY) return null
  if (!client) {
    client = new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST })
  }
  return client
}

export function isPostHogConfigured(): boolean {
  return !!POSTHOG_KEY
}

/**
 * Track an event server-side.
 */
export async function trackEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, any>
) {
  const client = getClient()
  if (!client) return
  try {
    client.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (e) {
    console.error('PostHog tracking failed:', e)
  }
}

/**
 * Track article view.
 */
export async function trackArticleView(articleId: string, articleTitle: string, sessionId: string) {
  await trackEvent(sessionId, 'article_viewed', {
    articleId,
    articleTitle,
  })
}

/**
 * Track search query.
 */
export async function trackSearch(query: string, resultsCount: number, sessionId: string) {
  await trackEvent(sessionId, 'search_performed', {
    query,
    resultsCount,
  })
}

/**
 * Track reaction.
 */
export async function trackReaction(articleId: string, type: string, sessionId: string) {
  await trackEvent(sessionId, 'reaction_added', {
    articleId,
    reactionType: type,
  })
}

/**
 * Track comment.
 */
export async function trackComment(articleId: string, sessionId: string) {
  await trackEvent(sessionId, 'comment_posted', {
    articleId,
  })
}

/**
 * Track newsletter subscription.
 */
export async function trackSubscription(email: string) {
  await trackEvent(email, 'newsletter_subscribed', {
    emailDomain: email.split('@')[1],
  })
}

// Shutdown helper (call on app shutdown)
export async function shutdownPostHog() {
  if (client) {
    await client.shutdown()
  }
}
