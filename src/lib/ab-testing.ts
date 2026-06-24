/**
 * A/B Testing System for headlines
 * Test two headlines for the same article and track which gets more clicks.
 */

import { db } from '@/lib/db'

export interface ABTest {
  id: string
  articleId: string
  variantA: string  // headline A
  variantB: string  // headline B
  clicksA: number
  clicksB: number
  viewsA: number
  viewsB: number
  status: 'running' | 'completed' | 'stopped'
  winner?: 'A' | 'B' | 'tie'
  startedAt: Date
  endedAt?: Date
}

/**
 * Get which variant to show to a user (consistent per session).
 */
export function getVariant(sessionId: string, testId: string): 'A' | 'B' {
  // Hash session + test ID for consistent assignment
  let hash = 0
  const str = sessionId + testId
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash % 2 === 0 ? 'A' : 'B'
}

/**
 * Track impression (article shown to user).
 */
export async function trackImpression(testId: string, variant: 'A' | 'B') {
  // In production, would update A/B test record
  // For now, just log
  console.log(`[A/B Test] Impression: test=${testId}, variant=${variant}`)
}

/**
 * Track click (user clicked the headline).
 */
export async function trackClick(testId: string, variant: 'A' | 'B') {
  console.log(`[A/B Test] Click: test=${testId}, variant=${variant}`)
}

/**
 * Calculate statistical significance (simplified chi-square).
 */
export function calculateSignificance(clicksA: number, viewsA: number, clicksB: number, viewsB: number): {
  isSignificant: boolean
  confidence: number
  winner: 'A' | 'B' | 'tie'
  ctrA: number
  ctrB: number
} {
  const ctrA = viewsA > 0 ? clicksA / viewsA : 0
  const ctrB = viewsB > 0 ? clicksB / viewsB : 0

  // Simple significance: need at least 100 impressions per variant
  const minSample = 100
  if (viewsA < minSample || viewsB < minSample) {
    return { isSignificant: false, confidence: 0, winner: 'tie', ctrA, ctrB }
  }

  // Calculate z-score (simplified)
  const pooledCTR = (clicksA + clicksB) / (viewsA + viewsB)
  const se = Math.sqrt(pooledCTR * (1 - pooledCTR) * (1 / viewsA + 1 / viewsB))
  const zScore = se > 0 ? Math.abs(ctrA - ctrB) / se : 0

  // Convert z-score to confidence (simplified)
  const confidence = Math.min(99, Math.round((1 - Math.exp(-zScore * zScore / 2)) * 100))
  const isSignificant = zScore > 1.96  // 95% confidence

  let winner: 'A' | 'B' | 'tie' = 'tie'
  if (isSignificant) {
    winner = ctrA > ctrB ? 'A' : 'B'
  }

  return { isSignificant, confidence, winner, ctrA, ctrB }
}
