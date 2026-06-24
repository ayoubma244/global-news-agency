/**
 * GET /api/health
 * Public health check endpoint for monitoring.
 */
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
const prisma = db
export async function GET() {
  const start = Date.now()
  try {
    // Test DB connection
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      version: '2.0.0',
      responseTimeMs: Date.now() - start,
    })
  } catch (e: any) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: e.message,
      database: 'disconnected',
      responseTimeMs: Date.now() - start,
    }, { status: 503 })
  }
}
