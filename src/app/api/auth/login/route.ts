import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSessionToken, setSessionCookie, rateLimit } from '@/lib/auth'
import { loginSchema, validate } from '@/lib/validation'
import { logActivity } from '@/lib/activity'
import { headers } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 login attempts per minute per IP
    const h = await headers()
    const ip = h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || 'unknown'
    const rl = rateLimit(`login:${ip}`, 5, 60_000)
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: 'محاولات كثيرة. حاول بعد دقيقة.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      )
    }

    const body = await req.json()
    const validation = validate(loginSchema, body)
    if (!validation.success) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 })
    }
    const { username, password } = validation.data

    const admin = await db.adminUser.findFirst({
      where: {
        OR: [{ username: username }, { email: username }],
      },
    })

    // Always run verify to prevent timing attacks
    const isValid = admin ? await verifyPassword(password, admin.passwordHash) : false

    if (!admin || !admin.isActive || !isValid) {
      return NextResponse.json({ ok: false, error: 'بيانات الدخول غير صحيحة' }, { status: 401 })
    }

    await db.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    })

    const token = createSessionToken({
      userId: admin.id,
      username: admin.username,
      role: admin.role,
    })
    await setSessionCookie(token)

    await logActivity(
      { userId: admin.id, username: admin.username, role: admin.role, exp: 0, iat: 0 },
      'login', 'admin',
      { entityId: admin.id, entityName: admin.username, details: { ip } }
    )

    return NextResponse.json({
      ok: true,
      admin: { id: admin.id, username: admin.username, email: admin.email, role: admin.role },
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
