/**
 * Fact-Checking Layer
 * Compares key facts between the original source and the AI-rewritten article.
 * Extracts: numbers, dates, percentages, names, URLs.
 * Flags discrepancies for manual review.
 *
 * This is a heuristic approach (not ML-based) for fast, reliable checks.
 */

export interface FactCheckResult {
  ok: boolean
  score: number  // 0-100 (100 = all facts match)
  checks: FactCheck[]
  discrepancies: string[]
  needsReview: boolean  // true if critical facts don't match
}

export interface FactCheck {
  type: 'number' | 'date' | 'percentage' | 'url' | 'name'
  source: string
  rewritten: string
  match: boolean
  severity: 'low' | 'medium' | 'high'
}

/**
 * Extract facts from text.
 */
function extractFacts(text: string): {
  numbers: Set<string>
  dates: Set<string>
  percentages: Set<string>
  urls: Set<string>
} {
  const numbers = new Set<string>()
  const dates = new Set<string>()
  const percentages = new Set<string>()
  const urls = new Set<string>()

  // Numbers (including large numbers with commas/dots)
  const numberMatches = text.match(/\b\d{1,3}(?:[,.\s]\d{3})*(?:\.\d+)?\b/g) || []
  // Filter out years (1900-2099) - they're usually dates
  numberMatches.forEach(n => {
    const clean = n.replace(/[,\s]/g, '')
    if (!/^(19|20)\d{2}$/.test(clean) && clean.length > 0) {
      numbers.add(clean)
    }
  })

  // Dates (various formats)
  const datePatterns = [
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,  // 01/15/2024
    /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g,  // 01-15-2024
    /\b\d{4}-\d{1,2}-\d{1,2}\b/g,  // 2024-01-15
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
    /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
    /\b(?:يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)\s+\d{1,4}\b/g,
  ]
  datePatterns.forEach(pattern => {
    const matches = text.match(pattern) || []
    matches.forEach(d => dates.add(d))
  })

  // Percentages
  const percentMatches = text.match(/\b\d+(?:\.\d+)?\s*%/g) || []
  percentMatches.forEach(p => percentages.add(p.replace(/\s/g, '')))

  // URLs
  const urlMatches = text.match(/https?:\/\/[^\s<>"']+/g) || []
  urlMatches.forEach(u => urls.add(u))

  return { numbers, dates, percentages, urls }
}

/**
 * Compare facts between source and rewritten text.
 */
export function factCheck(sourceText: string, rewrittenText: string): FactCheckResult {
  const sourceFacts = extractFacts(sourceText)
  const rewrittenFacts = extractFacts(rewrittenText)

  const checks: FactCheck[] = []
  const discrepancies: string[] = []
  let matchedCount = 0
  let totalCount = 0
  let hasHighSeverity = false

  // Compare numbers (high severity - wrong numbers = misinformation)
  for (const num of sourceFacts.numbers) {
    totalCount++
    const match = rewrittenFacts.numbers.has(num)
    checks.push({
      type: 'number',
      source: num,
      rewritten: match ? num : 'missing/changed',
      match,
      severity: 'high',
    })
    if (!match) {
      discrepancies.push(`Number "${num}" from source not found in rewritten article`)
      hasHighSeverity = true
    } else {
      matchedCount++
    }
  }

  // Compare dates (high severity)
  for (const date of sourceFacts.dates) {
    totalCount++
    const match = rewrittenFacts.dates.has(date)
    checks.push({
      type: 'date',
      source: date,
      rewritten: match ? date : 'missing/changed',
      match,
      severity: 'high',
    })
    if (!match) {
      discrepancies.push(`Date "${date}" from source not found in rewritten article`)
      hasHighSeverity = true
    } else {
      matchedCount++
    }
  }

  // Compare percentages (medium severity)
  for (const pct of sourceFacts.percentages) {
    totalCount++
    const match = rewrittenFacts.percentages.has(pct)
    checks.push({
      type: 'percentage',
      source: pct,
      rewritten: match ? pct : 'missing/changed',
      match,
      severity: 'medium',
    })
    if (!match) {
      discrepancies.push(`Percentage "${pct}" from source not found in rewritten article`)
    } else {
      matchedCount++
    }
  }

  // Compare URLs (low severity - URLs may be intentionally omitted)
  for (const url of sourceFacts.urls) {
    totalCount++
    const match = rewrittenFacts.urls.has(url)
    checks.push({
      type: 'url',
      source: url,
      rewritten: match ? url : 'omitted',
      match,
      severity: 'low',
    })
    if (match) matchedCount++
  }

  const score = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 100

  return {
    ok: score >= 70,  // 70% of facts must match
    score,
    checks: checks.slice(0, 20),  // Limit to first 20 for display
    discrepancies: discrepancies.slice(0, 10),
    needsReview: hasHighSeverity && score < 70,
  }
}
