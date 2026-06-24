/**
 * Session helper — generates and manages anonymous user sessions
 * for tracking bookmarks, reactions, reading history.
 */

import { cookies, headers } from 'next/headers'
import crypto from 'crypto'

const SESSION_COOKIE = 'news_user_session'

export async function getSessionId(): Promise<string> {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get(SESSION_COOKIE)?.value

  if (!sessionId) {
    // Generate new session ID
    const h = await headers()
    const ip = h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || 'unknown'
    const ua = h.get('user-agent') || 'unknown'
    sessionId = crypto
      .createHash('sha256')
      .update(`${ip}-${ua}-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`)
      .digest('hex')
      .slice(0, 32)

    cookieStore.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
  }

  return sessionId
}

export async function getVisitorInfo() {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0] || h.get('x-real-ip') || 'unknown'
  const ua = h.get('user-agent') || ''

  // Detect device
  let device = 'desktop'
  if (/Mobile|Android|iPhone|iPad/.test(ua)) device = 'mobile'
  else if (/iPad|Tablet/.test(ua)) device = 'tablet'

  // Detect browser
  let browser = 'other'
  if (/Chrome/.test(ua)) browser = 'chrome'
  else if (/Firefox/.test(ua)) browser = 'firefox'
  else if (/Safari/.test(ua)) browser = 'safari'
  else if (/Edge/.test(ua)) browser = 'edge'

  // Referrer
  const referrer = h.get('referer') || h.get('referrer') || ''
  let source = 'direct'
  if (referrer.includes('google.')) source = 'search'
  else if (referrer.includes('twitter') || referrer.includes('facebook') || referrer.includes('t.co')) source = 'social'
  else if (referrer) source = 'referral'

  return { ip, ua, device, browser, referrer, source }
}
