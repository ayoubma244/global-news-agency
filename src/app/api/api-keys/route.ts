/**
 * /api/api-keys
 * GET  - list all API keys (with masked keys)
 * POST - create new
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'

const prisma = db
function maskKey(key: string): string {
  if (key.length <= 8) return '****'
  return key.slice(0, 4) + '...' + key.slice(-4)
}

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: 'desc' },
  })

  // Mask sensitive values
  const masked = keys.map(k => ({
    ...k,
    apiKey: maskKey(k.apiKey),
    apiSecret: k.apiSecret ? maskKey(k.apiSecret) : null,
  }))

  return NextResponse.json({ ok: true, apiKeys: masked })
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const body = await req.json()
  const { name, provider, apiKey, apiSecret, endpoint, isActive = true, dailyLimit, notes } = body

  if (!name || !provider || !apiKey) {
    return NextResponse.json({ ok: false, error: 'الاسم والمزود و API key مطلوبون' }, { status: 400 })
  }

  const k = await prisma.apiKey.create({
    data: { name, provider, apiKey, apiSecret, endpoint, isActive, dailyLimit: dailyLimit ? parseInt(dailyLimit) : null, notes },
  })

  return NextResponse.json({
    ok: true,
    apiKey: { ...k, apiKey: maskKey(k.apiKey), apiSecret: k.apiSecret ? maskKey(k.apiSecret) : null },
  })
}
