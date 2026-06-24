import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSessionToken, setSessionCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ ok: false, error: 'اسم المستخدم وكلمة المرور مطلوبان' }, { status: 400 })
    }

    const admin = await db.adminUser.findFirst({
      where: {
        OR: [{ username: username }, { email: username }],
      },
    })

    if (!admin || !admin.isActive) {
      return NextResponse.json({ ok: false, error: 'بيانات الدخول غير صحيحة' }, { status: 401 })
    }

    if (!verifyPassword(password, admin.passwordHash)) {
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

    return NextResponse.json({
      ok: true,
      admin: { id: admin.id, username: admin.username, email: admin.email, role: admin.role },
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
