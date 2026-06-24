/**
 * /api/visitors
 * GET - real-time visitors count (last 5 minutes)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionId, getVisitorInfo } from '@/lib/session'

export async function GET() {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  const [activeNow, lastHour, byDevice, byCountry] = await Promise.all([
    db.siteVisitor.count({ where: { lastActive: { gte: fiveMinAgo } } }),
    db.siteVisitor.count({ where: { lastActive: { gte: oneHourAgo } } }),
    db.siteVisitor.groupBy({
      by: ['device'],
      where: { lastActive: { gte: fiveMinAgo } },
      _count: true,
    }),
    db.siteVisitor.groupBy({
      by: ['country'],
      where: { lastActive: { gte: fiveMinAgo }, country: { not: null } },
      _count: true,
      orderBy: { _count: { country: 'desc' } },
      take: 5,
    }),
  ])

  return NextResponse.json({
    ok: true,
    activeNow,
    lastHour,
    byDevice: byDevice.reduce((acc, d) => ({ ...acc, [d.device || 'unknown']: d._count }), {}),
    byCountry: byCountry.map(c => ({ country: c.country, count: c._count })),
  })
}

/**
 * POST - register visitor activity (heartbeat)
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { articleId } = body
  const sessionId = await getSessionId()
  const info = await getVisitorInfo()

  await db.siteVisitor.upsert({
    where: { sessionId },
    update: {
      lastActive: new Date(),
      articleId: articleId || null,
      device: info.device,
      browser: info.browser,
      referrer: info.referrer.slice(0, 200),
    },
    create: {
      sessionId,
      articleId: articleId || null,
      ipAddress: info.ip === 'unknown' ? null : info.ip,
      device: info.device,
      browser: info.browser,
      referrer: info.referrer.slice(0, 200),
      lastActive: new Date(),
    },
  })

  return NextResponse.json({ ok: true })
}
