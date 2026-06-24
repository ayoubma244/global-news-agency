/**
 * GET /api/backup/export - download full database backup
 * POST /api/backup/export - create backup to file
 */
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { exportDatabase, saveBackupToFile } from '@/lib/backup'

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  try {
    const data = await exportDatabase()
    const json = JSON.stringify(data, null, 2)
    const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`

    return new Response(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  try {
    const { path, size } = await saveBackupToFile()
    return NextResponse.json({
      ok: true,
      path: path.split('/').pop(),
      sizeKB: Math.round(size / 1024),
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
