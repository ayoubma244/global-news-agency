/**
 * Scheduled Jobs API
 * GET    - list all scheduled jobs
 * POST   - create new
 * PUT    - update (active/config)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

const prisma = db
export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const jobs = await prisma.scheduledJob.findMany({
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ ok: true, jobs })
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const body = await req.json()
  const { name, type, cron, isActive = true, config } = body

  if (!name || !type || !cron) {
    return NextResponse.json({ ok: false, error: 'الاسم والنوع والـ cron مطلوبون' }, { status: 400 })
  }

  // Compute next run time (simplified: +1 hour from now for new jobs)
  const nextRunAt = new Date(Date.now() + 60 * 60 * 1000)

  const job = await prisma.scheduledJob.create({
    data: {
      name, type, cron, isActive,
      config: config ? JSON.stringify(config) : null,
      nextRunAt,
    },
  })

  await logActivity({ userId: admin.id, username: admin.username, role: admin.role, exp: 0 }, 'create', 'job', {
    entityId: job.id, entityName: name, details: { type, cron },
  })

  return NextResponse.json({ ok: true, job })
}
