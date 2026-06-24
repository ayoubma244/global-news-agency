/**
 * /api/subscribers
 * POST   - subscribe (public)
 * GET    - list subscribers (admin)
 * DELETE - unsubscribe (via token)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin, rateLimit } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { subscribeSchema, validate } from '@/lib/validation'
import { headers } from 'next/headers'
import crypto from 'crypto'

const prisma = db

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '100')

  const subscribers = await prisma.subscriber.findMany({
    orderBy: { subscribedAt: 'desc' },
    take: limit,
    select: { id: true, email: true, name: true, isVerified: true, isActive: true, language: true, subscribedAt: true },
  })
  const total = await prisma.subscriber.count({ where: { isActive: true } })
  return NextResponse.json({ ok: true, subscribers, total })
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const h = await headers()
    const ip = h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || 'unknown'
    const rl = rateLimit(`subscribe:${ip}`, 3, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ ok: false, error: 'محاولات كثيرة' }, { status: 429 })
    }

    const body = await req.json()
    const validation = validate(subscribeSchema, body)
    if (!validation.success) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 })
    }
    const { email, name, language = 'ar', preferences } = validation.data

    const verifyToken = crypto.randomBytes(32).toString('hex')

    const subscriber = await prisma.subscriber.upsert({
      where: { email },
      update: {
        name: name || undefined,
        language,
        preferences: preferences ? JSON.stringify(preferences) : undefined,
        isActive: true,
        unsubscribedAt: null,
        verifyToken,
      },
      create: {
        email,
        name,
        language,
        preferences: preferences ? JSON.stringify(preferences) : undefined,
        verifyToken,
      },
    })

    return NextResponse.json({
      ok: true,
      message: 'تم الاشتراك بنجاح! تحقق من بريدك لتأكيد الاشتراك.',
      subscriber: { id: subscriber.id, email: subscriber.email },
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ ok: false, error: 'Token required' }, { status: 400 })
  }

  const subscriber = await prisma.subscriber.findFirst({ where: { verifyToken: token } })
  if (!subscriber) {
    return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 404 })
  }

  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: { isActive: false, unsubscribedAt: new Date() },
  })

  return NextResponse.json({ ok: true, message: 'تم إلغاء الاشتراك' })
}
