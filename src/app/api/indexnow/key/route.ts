/**
 * GET /api/indexnow/key
 * Returns the IndexNow key file content (for verification).
 * The key file should be accessible at /{key}.txt
 */
import { NextResponse } from 'next/server'
import { getIndexNowKey } from '@/lib/indexnow'

export async function GET() {
  const key = getIndexNowKey()
  // Return as plain text (IndexNow expects the key as the file content)
  return new NextResponse(key, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
