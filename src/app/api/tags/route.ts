/**
 * /api/tags
 * GET  - list all tags (sorted by count)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
const prisma = db
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '50')

  const tags = await prisma.tag.findMany({
    orderBy: { count: 'desc' },
    take: limit,
  })
  return NextResponse.json({ ok: true, tags })
}
