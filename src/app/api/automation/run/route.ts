/**
 * POST /api/automation/run
 * Body: { sourceId?, maxItemsPerSource?, forcePublish? }
 * Runs the RSS → AI Rewrite → Watermark → Publish pipeline.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { runRssPipeline } from '@/lib/rss-automation'

export const maxDuration = 300 // 5 minutes

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  try {
    const body = await req.json()
    const { sourceId, maxItemsPerSource, forcePublish } = body

    const result = await runRssPipeline({
      sourceId,
      maxItemsPerSource: maxItemsPerSource || 3,
      forcePublish,
    })

    return NextResponse.json({
      ok: true,
      ...result,
      message: `معالجة ${result.sourcesProcessed} مصدر، ${result.itemsFound} عنصر جديد، ${result.articlesCreated} مقال جديد، ${result.imagesProcessed} صورة معالجة`,
    })
  } catch (e: any) {
    console.error('Automation run error:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
