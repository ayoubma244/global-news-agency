/**
 * GET /api/recommendations - personalized feed for user session
 */
import { NextResponse } from 'next/server'
import { getPersonalizedFeed } from '@/lib/recommendations'
import { getSessionId } from '@/lib/session'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const sessionId = await getSessionId()

  const recommendations = await getPersonalizedFeed(sessionId, limit)
  return NextResponse.json({ ok: true, recommendations })
}
