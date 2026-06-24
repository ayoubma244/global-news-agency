import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentAdmin } from '@/lib/auth'

const prisma = new PrismaClient()

function maskKey(key: string): string {
  if (key.length <= 8) return '****'
  return key.slice(0, 4) + '...' + key.slice(-4)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, provider, apiKey, apiSecret, endpoint, isActive, dailyLimit, notes } = body

  const updateData: any = {}
  if (name !== undefined) updateData.name = name
  if (provider !== undefined) updateData.provider = provider
  if (apiKey !== undefined && apiKey.trim() !== '') updateData.apiKey = apiKey
  if (apiSecret !== undefined && apiSecret.trim() !== '') updateData.apiSecret = apiSecret
  if (endpoint !== undefined) updateData.endpoint = endpoint
  if (isActive !== undefined) updateData.isActive = isActive
  if (dailyLimit !== undefined) updateData.dailyLimit = dailyLimit ? parseInt(dailyLimit) : null
  if (notes !== undefined) updateData.notes = notes

  const k = await prisma.apiKey.update({ where: { id }, data: updateData })
  return NextResponse.json({
    ok: true,
    apiKey: { ...k, apiKey: maskKey(k.apiKey), apiSecret: k.apiSecret ? maskKey(k.apiSecret) : null },
  })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  await prisma.apiKey.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const k = await prisma.apiKey.update({
    where: { id },
    data: { isActive: !!body.isActive },
  })
  return NextResponse.json({ ok: true, apiKey: { ...k, apiKey: maskKey(k.apiKey) } })
}
