import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { status } = body

  if (!['pending', 'approved', 'rejected', 'spam'].includes(status)) {
    return NextResponse.json({ ok: false, error: 'حالة غير صالحة' }, { status: 400 })
  }

  const comment = await db.comment.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json({ ok: true, comment })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  await db.comment.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
