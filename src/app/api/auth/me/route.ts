import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ ok: false, admin: null }, { status: 401 })
  }
  return NextResponse.json({
    ok: true,
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      lastLoginAt: admin.lastLoginAt,
    },
  })
}
