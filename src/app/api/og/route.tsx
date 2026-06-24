/**
 * GET /api/og?title=...&category=...&image=...
 * Generates dynamic Open Graph images for social sharing.
 * Returns a PNG image (1200x630) with:
 * - Article title
 * - Category badge
 * - Site name
 * - Background gradient
 */

import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') || 'Global News Agency'
  const category = searchParams.get('category') || 'News'
  const icon = searchParams.get('icon') || '📰'
  const siteName = searchParams.get('site') || 'Global News Agency'

  // Truncate title for display
  const displayTitle = title.length > 100 ? title.slice(0, 97) + '...' : title

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #1B2A4A 0%, #2D4A3E 100%)',
          padding: '60px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top: Category badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: '20px',
              padding: '8px 20px',
              color: 'white',
              fontSize: 24,
            }}
          >
            <span style={{ fontSize: 28 }}>{icon}</span>
            <span>{category}</span>
          </div>
        </div>

        {/* Middle: Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            color: 'white',
            fontSize: 52,
            fontWeight: 700,
            lineHeight: 1.2,
            maxWidth: '1000px',
          }}
        >
          {displayTitle}
        </div>

        {/* Bottom: Site name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.8)' }}>
            <div
              style={{
                width: 48,
                height: 48,
                backgroundColor: 'white',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
              }}
            >
              📰
            </div>
            <span style={{ fontSize: 28, fontWeight: 600 }}>{siteName}</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 22 }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
