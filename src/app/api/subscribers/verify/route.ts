/**
 * /api/subscribers/verify
 * GET  - verify email (from email link)
 * POST - verify email (API call)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function verifyTokenHandler(token: string) {
  if (!token) {
    return { ok: false, error: 'Token مطلوب' }
  }

  const subscriber = await db.subscriber.findFirst({
    where: { verifyToken: token },
  })

  if (!subscriber) {
    return { ok: false, error: 'Token غير صالح أو منتهي' }
  }

  await db.subscriber.update({
    where: { id: subscriber.id },
    data: { isVerified: true, verifyToken: null },
  })

  return { ok: true, message: 'تم تأكيد بريدك الإلكتروني بنجاح!' }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  const result = await verifyTokenHandler(token || '')

  // Redirect to homepage with message
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  if (result.ok) {
    return NextResponse.redirect(`${baseUrl}/?verified=1`)
  } else {
    return NextResponse.redirect(`${baseUrl}/?verified=0&error=${encodeURIComponent(result.error)}`)
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { token } = body
  const result = await verifyTokenHandler(token)
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
