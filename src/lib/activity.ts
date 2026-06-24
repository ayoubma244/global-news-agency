/**
 * Activity Logger — audit trail for all admin actions.
 * Logs to ActivityLog table with admin info, action, entity, IP, user agent.
 */

import { db } from '@/lib/db'
import { headers } from 'next/headers'
import type { SessionPayload } from '@/lib/auth'

export async function logActivity(
  session: SessionPayload | null,
  action: string,
  entity: string,
  opts?: {
    entityId?: string
    entityName?: string
    details?: any
  }
) {
  try {
    const h = await headers()
    const forwarded = h.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0] || h.get('x-real-ip') || 'unknown'
    const ua = h.get('user-agent') || 'unknown'

    await db.activityLog.create({
      data: {
        adminId: session?.userId || null,
        adminName: session?.username || null,
        action,
        entity,
        entityId: opts?.entityId,
        entityName: opts?.entityName,
        details: opts?.details ? JSON.stringify(opts.details) : null,
        ipAddress: ip,
        userAgent: ua,
      },
    })
  } catch (e) {
    console.error('Failed to log activity:', e)
  }
}
