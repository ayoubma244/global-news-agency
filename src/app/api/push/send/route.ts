/**
 * POST /api/push/send
 * Admin: send push notification to all subscribers (e.g., breaking news)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { pushSubscriptions } from '../subscribe/route'

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const body = await req.json()
  const { title, body: messageBody, url, tag } = body

  if (!title || !messageBody) {
    return NextResponse.json({ ok: false, error: 'العنوان والمحتوى مطلوبان' }, { status: 400 })
  }

  const payload = JSON.stringify({
    title,
    body: messageBody,
    url: url || '/',
    tag: tag || 'news',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
  })

  let sent = 0
  let failed = 0

  for (const [sessionId, subscription] of pushSubscriptions.entries()) {
    try {
      // In production, use web-push library to send
      // const webpush = require('web-push')
      // await webpush.sendNotification(subscription, payload)
      console.log(`[Push] Sending to ${sessionId}: ${title}`)
      sent++
    } catch (e: any) {
      console.error(`[Push] Failed for ${sessionId}:`, e.message)
      failed++
      // Remove invalid subscriptions
      if (e.statusCode === 410 || e.statusCode === 404) {
        pushSubscriptions.delete(sessionId)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    total: pushSubscriptions.size,
  })
}
