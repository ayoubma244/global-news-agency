/**
 * GET /api/cron/automation
 * Cron-triggered endpoint to run automation on schedule.
 *
 * Protection: requires CRON_SECRET in Authorization header.
 *
 * Set up a cron job (every hour):
 *   curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
 *        https://yoursite.com/api/cron/automation
 *
 * Or use Vercel Cron (vercel.json):
 *   {
 *     "crons": [{
 *       "path": "/api/cron/automation",
 *       "schedule": "0 * * * *"
 *     }]
 *   }
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { runRssPipeline } from '@/lib/rss-automation'

const prisma = db
export const maxDuration = 300 // 5 min
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Verify secret
  const authHeader = req.headers.get('authorization') || ''
  const secret = process.env.CRON_SECRET || 'cron-secret-change-me'
  const token = authHeader.replace(/^Bearer\s+/i, '')

  if (token !== secret) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find the automation scheduled job config
    const job = await prisma.scheduledJob.findFirst({
      where: { type: 'automation_run', isActive: true },
    })

    const config = job?.config ? JSON.parse(job.config) : {}
    const maxItemsPerSource = config.maxItemsPerSource || config.trendsLimit || 3
    const forcePublish = config.autoPublish ?? false

    // Run the RSS pipeline
    const start = Date.now()
    const result = await runRssPipeline({
      maxItemsPerSource,
      forcePublish,
    })
    const durationMs = Date.now() - start

    // Update job status
    if (job) {
      await prisma.scheduledJob.update({
        where: { id: job.id },
        data: {
          lastRunAt: new Date(),
          nextRunAt: new Date(Date.now() + 60 * 60 * 1000), // +1 hour
          lastStatus: result.errors.length === 0 ? 'success' : 'error',
          lastError: result.errors.length > 0 ? result.errors.join('; ') : null,
          runCount: { increment: 1 },
        },
      })
    }

    return NextResponse.json({
      ok: true,
      duration: durationMs,
      result,
      nextRunAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })
  } catch (e: any) {
    console.error('Cron automation error:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // Allow POST too (some cron services use POST)
  return GET(req)
}
