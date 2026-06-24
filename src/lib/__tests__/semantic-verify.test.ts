/**
 * Tests for Semantic Verification Layer
 */
import { describe, it, expect } from 'vitest'
import { verifyArticle } from '@/lib/semantic-verify'

describe('Semantic Verification', () => {
  it('should pass verification when claims match', async () => {
    const source = 'Said President John Smith in Washington: "We will monitor the situation."'
    const rewritten = 'Said President John Smith in Washington: "We will monitor the situation."'
    const result = await verifyArticle(source, 'Test', rewritten, 'Test')
    expect(result.factCheckResult.score).toBeGreaterThanOrEqual(50)
  })

  it('should detect added details (names not in source)', async () => {
    const source = 'The president met with officials.'
    const rewritten = 'The president met with John Smith in Washington.'
    // "John Smith" and "Washington" are added details
    const result = await verifyArticle(source, 'Test', rewritten, 'Test')
    const unverifiedClaims = result.claims.filter(c => !c.verified && c.source === 'rewritten')
    expect(unverifiedClaims.length).toBeGreaterThan(0)
  })

  it('should detect locations correctly', async () => {
    const source = 'The event occurred in الرياض.'
    const rewritten = 'The event occurred in الرياض.'
    const result = await verifyArticle(source, 'Test', rewritten, 'Test')
    const locationClaims = result.claims.filter(c => c.type === 'location')
    expect(locationClaims.length).toBeGreaterThan(0)
  })

  it('should detect matching quotes', async () => {
    const source = 'He said: "This is a test quote for verification."'
    const rewritten = 'He said: "This is a test quote for verification."'
    const result = await verifyArticle(source, 'Test', rewritten, 'Test')
    const quoteClaims = result.claims.filter(c => c.type === 'quote')
    expect(quoteClaims.length).toBeGreaterThan(0)
  })

  it('should handle empty text', async () => {
    const result = await verifyArticle('', '', '', '')
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.needsManualReview).toBe(false)
  })

  it('should flag danger when fact-check fails', async () => {
    const source = 'The number is 5,000,000 and date is 2024-01-15.'
    const rewritten = 'The number is unknown.'  // Missing all facts
    const result = await verifyArticle(source, 'Test', rewritten, 'Test')
    expect(result.factCheckResult.needsReview).toBe(true)
    expect(result.confidence).toBeLessThan(100)
  })

  it('should provide recommendations', async () => {
    const source = 'The deal was 50,000,000 dollars on January 15, 2024.'
    const rewritten = 'The deal was large.'
    const result = await verifyArticle(source, 'Test', rewritten, 'Test')
    expect(result.recommendations.length).toBeGreaterThan(0)
  })

  it('should return status type', async () => {
    const result = await verifyArticle('test', 'test', 'test', 'test')
    expect(['verified', 'warning', 'danger', 'unverified']).toContain(result.status)
  })
})
