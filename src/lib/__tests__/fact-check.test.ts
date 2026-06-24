/**
 * Tests for fact-check layer
 */
import { describe, it, expect } from 'vitest'
import { factCheck } from '@/lib/fact-check'

describe('Fact-Check', () => {
  it('should pass when all facts match', () => {
    const source = 'The company earned $1,500,000 in 2024, representing 15% growth.'
    const rewritten = 'حققت الشركة إيرادات بقيمة 1,500,000 دولار في عام 2024، بنمو 15%.'
    // Numbers: 1,500,000 → should match
    // Percentage: 15% → should match
    const result = factCheck(source, rewritten)
    expect(result.score).toBeGreaterThanOrEqual(50) // At least some facts match
  })

  it('should detect missing numbers', () => {
    const source = 'The population is 8,000,000,000 people.'
    const rewritten = 'عدد السكان كبير جداً.'  // No numbers
    const result = factCheck(source, rewritten)
    expect(result.needsReview).toBe(true)
    expect(result.score).toBeLessThan(70)
  })

  it('should detect matching percentages', () => {
    const source = 'Inflation reached 5.2% last month.'
    const rewritten = 'بلغ التضخم 5.2% الشهر الماضي.'
    const result = factCheck(source, rewritten)
    expect(result.score).toBeGreaterThan(50)
  })

  it('should detect matching dates', () => {
    const source = 'On January 15, 2024, the event occurred.'
    const rewritten = 'في January 15, 2024، وقع الحدث.'
    const result = factCheck(source, rewritten)
    expect(result.score).toBeGreaterThan(50)
  })

  it('should handle empty text', () => {
    const result = factCheck('', '')
    expect(result.score).toBe(100) // No facts to check = perfect score
    expect(result.needsReview).toBe(false)
  })

  it('should flag high severity for missing numbers', () => {
    const source = 'The deal was worth 50,000,000 dollars.'
    const rewritten = 'كانت الصفقة كبيرة.'  // No numbers
    const result = factCheck(source, rewritten)
    expect(result.needsReview).toBe(true)
    const highSeverityChecks = result.checks.filter(c => c.severity === 'high' && !c.match)
    expect(highSeverityChecks.length).toBeGreaterThan(0)
  })

  it('should extract URLs', () => {
    const source = 'Visit https://example.com for more info.'
    const rewritten = 'Visit https://example.com for details.'
    const result = factCheck(source, rewritten)
    const urlChecks = result.checks.filter(c => c.type === 'url')
    expect(urlChecks.length).toBeGreaterThan(0)
    expect(urlChecks[0].match).toBe(true)
  })
})
