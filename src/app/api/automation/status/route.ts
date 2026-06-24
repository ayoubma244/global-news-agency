/**
 * GET /api/automation/status
 * Returns automation system status: AI configured, last run, success rate.
 */
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentAdmin } from '@/lib/auth'
import { isAIConfigured } from '@/lib/zai'

const prisma = new PrismaClient()

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  // Get last 24h logs
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const [recentLogs, totalLogs, successCount, errorCount, lastRun] = await Promise.all([
    prisma.automationLog.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 1,
      select: { createdAt: true },
    }),
    prisma.automationLog.count({ where: { createdAt: { gte: since } } }),
    prisma.automationLog.count({ where: { createdAt: { gte: since }, status: 'success' } }),
    prisma.automationLog.count({ where: { createdAt: { gte: since }, status: 'error' } }),
    prisma.automationLog.findFirst({ orderBy: { createdAt: 'desc' } }),
  ])

  return NextResponse.json({
    ok: true,
    status: {
      aiConfigured: isAIConfigured(),
      totalRuns24h: totalLogs,
      successCount,
      errorCount,
      successRate: totalLogs > 0 ? Math.round((successCount / totalLogs) * 100) : 0,
      lastRunAt: lastRun?.createdAt || null,
    },
  })
}
