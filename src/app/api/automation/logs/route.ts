/**
 * GET /api/automation/logs
 * Returns recent automation logs (last 100).
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'

const prisma = db
export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '100')
  const stage = searchParams.get('stage')

  const where: any = {}
  if (stage) where.stage = stage

  const logs = await prisma.automationLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  // Get stats
  const stats = await prisma.automationLog.groupBy({
    by: ['stage', 'status'],
    _count: true,
  })

  return NextResponse.json({ ok: true, logs, stats })
}
