/**
 * /api/push/subscribe
 * POST   - subscribe to push notifications
 * DELETE - unsubscribe
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSessionId } from '@/lib/session'

// In production, store subscriptions in DB
// For now, in-memory
const pushSubscriptions = new Map<string, any>()

export async function POST(req: NextRequest) {
  const subscription = await req.json()
  const sessionId = await getSessionId()

  pushSubscriptions.set(sessionId, subscription)

  return NextResponse.json({ ok: true, message: 'تم الاشتراك في الإشعارات' })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json()
  const sessionId = await getSessionId()

  pushSubscriptions.delete(sessionId)

  return NextResponse.json({ ok: true })
}

// Export for use in send endpoint
export { pushSubscriptions }
