/**
 * Social Media Auto-Posting Service
 * - Twitter/X API
 * - Facebook Graph API
 * - Telegram Bot API
 * Posts breaking news / new articles automatically.
 */

import { db } from '@/lib/db'

export interface SocialPost {
  text: string
  url: string
  imageUrl?: string
  articleId: string
}

export interface PostResult {
  ok: boolean
  platform: string
  postId?: string
  error?: string
}

// ===== Twitter/X =====
export async function postToTwitter(post: SocialPost): Promise<PostResult> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN
  if (!bearerToken) return { ok: false, platform: 'twitter', error: 'Not configured' }

  try {
    // Note: Twitter API v2 requires media upload first, then status update
    // This is a simplified version - in production, use twitter-api-v2 SDK
    const text = `${post.text.slice(0, 240)}\n\n${post.url}`

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { ok: false, platform: 'twitter', error }
    }

    const data = await response.json()
    return { ok: true, platform: 'twitter', postId: data.data?.id }
  } catch (e: any) {
    return { ok: false, platform: 'twitter', error: e.message }
  }
}

// ===== Facebook =====
export async function postToFacebook(post: SocialPost): Promise<PostResult> {
  const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN
  const pageId = process.env.FACEBOOK_PAGE_ID
  if (!pageAccessToken || !pageId) return { ok: false, platform: 'facebook', error: 'Not configured' }

  try {
    const message = `${post.text}\n\n${post.url}`
    const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        access_token: pageAccessToken,
        link: post.url,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { ok: false, platform: 'facebook', error }
    }

    const data = await response.json()
    return { ok: true, platform: 'facebook', postId: data.id }
  } catch (e: any) {
    return { ok: false, platform: 'facebook', error: e.message }
  }
}

// ===== Telegram =====
export async function postToTelegram(post: SocialPost): Promise<PostResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHANNEL_ID
  if (!botToken || !chatId) return { ok: false, platform: 'telegram', error: 'Not configured' }

  try {
    const text = `📰 <b>${escapeHtml(post.text)}</b>\n\n<a href="${post.url}">اقرأ المقال كاملاً ←</a>`

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { ok: false, platform: 'telegram', error }
    }

    const data = await response.json()
    return { ok: true, platform: 'telegram', postId: String(data.result?.message_id) }
  } catch (e: any) {
    return { ok: false, platform: 'telegram', error: e.message }
  }
}

// ===== Main: post to all configured platforms =====
export async function postToAllSocialPlatforms(article: {
  id: string
  titleAr: string
  slug: string
  featuredImg?: string | null
  isBreaking?: boolean
  category?: { nameAr: string; icon: string }
}): Promise<PostResult[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const post: SocialPost = {
    text: article.isBreaking
      ? `🚨 خبر عاجل: ${article.titleAr}`
      : `${article.category?.icon || '📰'} ${article.titleAr}`,
    url: `${baseUrl}/article/${article.slug}`,
    imageUrl: article.featuredImg || undefined,
    articleId: article.id,
  }

  const results = await Promise.allSettled([
    postToTwitter(post),
    postToFacebook(post),
    postToTelegram(post),
  ])

  return results.map(r => r.status === 'fulfilled' ? r.value : { ok: false, platform: 'unknown', error: r.reason?.message })
}

export function isSocialConfigured(): { twitter: boolean; facebook: boolean; telegram: boolean } {
  return {
    twitter: !!process.env.TWITTER_BEARER_TOKEN,
    facebook: !!(process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID),
    telegram: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID),
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c] || c)
}
