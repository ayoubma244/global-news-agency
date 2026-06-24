/**
 * GET /api/sitemap/ping
 * Notify Google + Bing about sitemap updates.
 */

import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const sitemapUrl = `${siteUrl}/sitemap.xml`

  const results: Array<{ engine: string; ok: boolean; status?: number; error?: string }> = []

  // Ping Google
  try {
    const res = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, {
      signal: AbortSignal.timeout(10000),
    })
    results.push({ engine: 'Google', ok: res.ok, status: res.status })
  } catch (e: any) {
    results.push({ engine: 'Google', ok: false, error: e.message })
  }

  // Ping Bing
  try {
    const res = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, {
      signal: AbortSignal.timeout(10000),
    })
    results.push({ engine: 'Bing', ok: res.ok, status: res.status })
  } catch (e: any) {
    results.push({ engine: 'Bing', ok: false, error: e.message })
  }

  const successCount = results.filter(r => r.ok).length

  return NextResponse.json({
    ok: successCount > 0,
    message: `تم إعلام ${successCount}/${results.length} محركات البحث`,
    results,
  })
}
