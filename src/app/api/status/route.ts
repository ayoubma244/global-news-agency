/**
 * /api/status - public site status (no auth)
 */
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  const [installLock, catCount, articleCount, pageCount] = await Promise.all([
    prisma.installLock.findFirst(),
    prisma.category.count(),
    prisma.article.count(),
    prisma.page.count(),
  ])

  return NextResponse.json({
    ok: true,
    installed: !!installLock?.isInstalled,
    version: installLock?.version || '1.0.0',
    stats: {
      categories: catCount,
      articles: articleCount,
      pages: pageCount,
    },
  })
}
