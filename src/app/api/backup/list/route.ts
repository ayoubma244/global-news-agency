import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { listBackups } from '@/lib/backup'

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const backups = await listBackups()
  return NextResponse.json({ ok: true, backups })
}
