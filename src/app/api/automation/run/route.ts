/**
 * POST /api/automation/run
 * Body: { trendsLimit?, autoPublish?, categoryId?, manualTopic? }
 * Runs the full 7-stage automation pipeline.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { runPipeline } from '@/lib/automation'

export const maxDuration = 300 // 5 minutes

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  try {
    const body = await req.json()
    const { trendsLimit, autoPublish, categoryId, manualTopic } = body

    const result = await runPipeline({
      trendsLimit: trendsLimit || 3,
      autoPublish: autoPublish ?? false,
      categoryId,
      manualTopic,
    })

    return NextResponse.json({
      ok: true,
      ...result,
      message: `اكتشف ${result.trendsFound} ترند، عالج ${result.articlesProcessed} مقال، نشر ${result.articlesPublished} مقال`,
    })
  } catch (e: any) {
    console.error('Automation run error:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
