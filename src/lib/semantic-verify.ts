/**
 * Semantic Verification Layer
 * ===================================
 * يكشف الـ Hallucinations بـ 4 طبقات:
 *
 * 1. Claim Extraction: استخراج الادعاءات (الأرقام، التواريخ، الأسماء، الاقتباسات)
 * 2. Cross-Reference: مقارنة كل ادعاء بين المصدر والمقال
 * 3. AI Verification: استخدام AI للتحقق الدلالي
 * 4. Confidence Scoring: درجة ثقة + تصنيف (safe/warning/danger)
 *
 * هذا يلتقط أنواع الـ Hallucinations التي لا يلتقطها fact-check.ts:
 * - تفاصيل مُضافة لم تُذكر في المصدر
 * - اقتباسات مُختلقة
 * - تحريف المعنى
 * - استنتاجات غير مبررة
 */

import { getZAI, isAIConfigured } from '@/lib/zai'
import { factCheck, type FactCheckResult } from '@/lib/fact-check'

export type VerificationStatus = 'verified' | 'warning' | 'danger' | 'unverified'

export interface Claim {
  type: 'number' | 'date' | 'name' | 'quote' | 'fact' | 'location'
  text: string
  source: 'original' | 'rewritten' | 'both'
  verified: boolean
  notes?: string
}

export interface SemanticVerification {
  status: VerificationStatus
  confidence: number  // 0-100
  claims: Claim[]
  factCheckResult: FactCheckResult
  aiVerification?: {
    addedDetails: string[]      // تفاصيل أضافها الـ AI
    alteredQuotes: string[]     // اقتباسات حُرّفت
    meaningShift: string[]      // تحريف في المعنى
    unsupportedClaims: string[] // ادعاءات بلا دليل
    overallAssessment: string
  }
  recommendations: string[]
  needsManualReview: boolean
}

/**
 * طبقة التحقق الرئيسية - تجمع كل الفحوصات.
 */
export async function verifyArticle(
  sourceText: string,
  sourceTitle: string,
  rewrittenText: string,
  rewrittenTitle: string
): Promise<SemanticVerification> {
  // Layer 1: Basic fact-checking (numbers, dates, percentages, URLs)
  const factCheckResult = factCheck(sourceText, rewrittenText)

  // Layer 2: Claim extraction (names, quotes, locations)
  const sourceClaims = extractClaims(sourceText + ' ' + sourceTitle)
  const rewrittenClaims = extractClaims(rewrittenText + ' ' + rewrittenTitle)
  const claims = compareClaims(sourceClaims, rewrittenClaims)

  // Layer 3: AI-powered semantic verification (only if AI configured)
  let aiVerification: SemanticVerification['aiVerification'] | undefined
  if (isAIConfigured()) {
    try {
      aiVerification = await aiVerify(sourceText, sourceTitle, rewrittenText, rewrittenTitle)
    } catch (e: any) {
      console.error('AI verification failed:', e.message)
    }
  }

  // Calculate overall confidence
  let confidence = factCheckResult.score
  let status: VerificationStatus = 'verified'
  const recommendations: string[] = []

  // Downgrade based on fact-check
  if (factCheckResult.needsReview) {
    status = 'warning'
    confidence -= 20
    recommendations.push('بعض الحقائق الأساسية (أرقام/تواريخ) غير متطابقة')
  }

  // Downgrade based on claims
  const unverifiedClaims = claims.filter(c => !c.verified)
  if (unverifiedClaims.length > 2) {
    status = 'warning'
    confidence -= 15
    recommendations.push(`${unverifiedClaims.length} ادعاءات في المقال غير موجودة في المصدر الأصلي`)
  }

  // Downgrade based on AI verification
  if (aiVerification) {
    if (aiVerification.addedDetails.length > 0) {
      confidence -= aiVerification.addedDetails.length * 10
      recommendations.push(`الـ AI أضاف ${aiVerification.addedDetails.length} تفاصيل غير موجودة في المصدر`)
    }
    if (aiVerification.alteredQuotes.length > 0) {
      status = 'danger'
      confidence -= 30
      recommendations.push(`⚠️ تم تحريف ${aiVerification.alteredQuotes.length} اقتباس - مراجعة ضرورية`)
    }
    if (aiVerification.unsupportedClaims.length > 0) {
      status = 'danger'
      confidence -= 25
      recommendations.push(`⚠️ ${aiVerification.unsupportedClaims.length} ادعاءات بلا دليل من المصدر`)
    }
    if (aiVerification.meaningShift.length > 0) {
      confidence -= 15
      recommendations.push('تحريف محتمل في المعنى العام')
    }
  }

  confidence = Math.max(0, Math.min(100, confidence))

  // Final status determination
  if (confidence < 50) {
    status = 'danger'
  } else if (confidence < 75) {
    status = 'warning'
  } else if (!isAIConfigured()) {
    status = 'unverified'  // لم يتم التحقق الدلالي
  }

  const needsManualReview = status === 'danger' || (status === 'warning' && confidence < 60)

  return {
    status,
    confidence,
    claims,
    factCheckResult,
    aiVerification,
    recommendations,
    needsManualReview,
  }
}

// ===== Layer 2: Claim Extraction =====

function extractClaims(text: string): Claim[] {
  const claims: Claim[] = []

  // Names (Capitalized words, Arabic names)
  const namePatterns = [
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g,  // John Smith
    /\b(?:الرئيس|الملك|الأمير|الشيخ|السيد|الدكتور)\s+[\u0600-\u06FF]+/g,  // الرئيس محمد
  ]
  namePatterns.forEach(pattern => {
    const matches = text.match(pattern) || []
    matches.forEach(m => {
      claims.push({ type: 'name', text: m, source: 'original', verified: false })
    })
  })

  // Quotes (text between quotation marks)
  const quotePattern = /["«»"]([^"«»"]{10,200})["«»"]/g
  const quoteMatches = text.match(quotePattern) || []
  quoteMatches.forEach(q => {
    claims.push({ type: 'quote', text: q, source: 'original', verified: false })
  })

  // Locations (cities, countries - basic detection)
  const locationPattern = /(?:بكين|واشنطن|لندن|باريس|برلين|موسكو|طوكيو|الرياض|القاهرة|دبي|بغداد|دمشق|بيروت|طهران|أنقرة|إستانبول|القدس|غزة|الخرطوم|الدوحة|الكويت|عمّان|الرباط|تونس|الجزائر|طرابلس|صنعاء|مقديشو|نيروبي|أديس أبابا|بريتوريا|نيودلهي|إسلام آباد|كابل|بانكوك|جاكرتا|مانيلا|سيول|مدريد|روما|أثينا|فيينا|ستوكهولم|أوسلو|كوبنهاغن|هلسنكي|أوتاوا|كانبيرا|ويلينغتون)/g
  const locationMatches = text.match(locationPattern) || []
  locationMatches.forEach(l => {
    claims.push({ type: 'location', text: l, source: 'original', verified: false })
  })

  return deduplicateClaims(claims)
}

function compareClaims(sourceClaims: Claim[], rewrittenClaims: Claim[]): Claim[] {
  const allClaims = [...sourceClaims.map(c => ({ ...c, source: 'original' as const }))]

  for (const rc of rewrittenClaims) {
    // Check if this claim exists in source (fuzzy match)
    const found = sourceClaims.some(sc =>
      sc.type === rc.type && (
        sc.text === rc.text ||
        sc.text.includes(rc.text) ||
        rc.text.includes(sc.text) ||
        levenshteinSimilarity(sc.text, rc.text) > 0.8
      )
    )

    if (found) {
      // Mark source claim as verified
      const sourceClaim = allClaims.find(c => c.text === rc.text || c.text.includes(rc.text) || rc.text.includes(c.text))
      if (sourceClaim) {
        sourceClaim.verified = true
        sourceClaim.source = 'both'
      }
    } else {
      // Claim only in rewritten - potential hallucination
      allClaims.push({ ...rc, source: 'rewritten', verified: false, notes: 'غير موجود في المصدر الأصلي' })
    }
  }

  return allClaims
}

// ===== Layer 3: AI-Powered Verification =====

async function aiVerify(
  sourceText: string,
  sourceTitle: string,
  rewrittenText: string,
  rewrittenTitle: string
): Promise<NonNullable<SemanticVerification['aiVerification']>> {
  const zai = getZAI()

  const prompt = `You are a strict fact-checker for a news agency. Your job is to detect AI HALLUCINATIONS in a rewritten news article.

ORIGINAL SOURCE ARTICLE:
Title: ${sourceTitle}
Content: ${sourceText.slice(0, 3000)}

REWRITTEN ARTICLE (to verify):
Title: ${rewrittenTitle}
Content: ${rewrittenText.slice(0, 3000)}

Check the rewritten article for these HALLUCINATION types:

1. ADDED DETAILS: Details mentioned in the rewritten article that do NOT exist in the source (e.g., specific locations, times, numbers, descriptions that weren't in the original).

2. ALTERED QUOTES: Any quotes that were modified, paraphrased incorrectly, or fabricated. Compare every quote in the rewritten article with the source.

3. MEANING SHIFT: Cases where the rewritten article changes the meaning, tone, or implication of the original (e.g., "may" becomes "will", "some" becomes "all", "reported" becomes "confirmed").

4. UNSUPPORTED CLAIMS: Statements presented as facts in the rewritten article that are not supported by the source.

5. OVERALL ASSESSMENT: Is the rewritten article faithful to the source? Or does it contain hallucinations?

Return ONLY valid JSON:
{
  "addedDetails": ["detail 1", "detail 2"],
  "alteredQuotes": ["original: X | rewritten: Y"],
  "meaningShift": ["description of shift"],
  "unsupportedClaims": ["claim that has no basis in source"],
  "overallAssessment": "faithful | minor issues | major hallucinations",
  "hallucinationScore": 0-100 (0 = no hallucinations, 100 = completely fabricated)
}`

  const response = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a meticulous fact-checker. You must be STRICT - any addition not in the source is a hallucination. Respond only with valid JSON.'
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.1,  // Very low for consistency
    max_tokens: 1500,
  })

  const content = response?.choices?.[0]?.message?.content || '{}'
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

  return {
    addedDetails: Array.isArray(parsed.addedDetails) ? parsed.addedDetails : [],
    alteredQuotes: Array.isArray(parsed.alteredQuotes) ? parsed.alteredQuotes : [],
    meaningShift: Array.isArray(parsed.meaningShift) ? parsed.meaningShift : [],
    unsupportedClaims: Array.isArray(parsed.unsupportedClaims) ? parsed.unsupportedClaims : [],
    overallAssessment: parsed.overallAssessment || 'unknown',
  }
}

// ===== Helpers =====

function deduplicateClaims(claims: Claim[]): Claim[] {
  const seen = new Set<string>()
  return claims.filter(c => {
    const key = `${c.type}:${c.text}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function levenshteinSimilarity(a: string, b: string): number {
  if (a.length === 0 || b.length === 0) return 0
  const aWords = a.toLowerCase().split(/\s+/)
  const bWords = b.toLowerCase().split(/\s+/)
  const maxLength = Math.max(aWords.length, bWords.length)
  const commonWords = aWords.filter(w => bWords.includes(w)).length
  return commonWords / maxLength
}
