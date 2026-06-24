/**
 * Cross-Reference Verification (Layer 5)
 * ===================================
 * يبحث عن نفس الخبر في مصادر متعددة ويتحقق من الحقائق عبرها.
 *
 * الفكرة: إذا ذكر مصدر واحد "50 قتيلاً" ومصدر آخر "45 قتيلاً"，
 * النظام يكتشف التناقض ويوجه للمراجعة اليدوية.
 *
 * يستخدم: Z.ai web_search function للبحث عن نفس الخبر
 */

import { getZAI, isAIConfigured } from '@/lib/zai'

export interface CrossReferenceSource {
  title: string
  url: string
  snippet: string
  source: string
  publishedTime?: string
}

export interface CrossReferenceResult {
  ok: boolean
  sourcesFound: number
  sources: CrossReferenceSource[]
  consistentFacts: string[]      // حقائق متفق عليها في كل المصادر
  conflictingFacts: Array<{
    fact: string
    variations: string[]
    sources: string[]
  }>
  confidence: number             // 0-100 (100 = كل المصادر متفق)
  needsManualReview: boolean
  recommendation: string
}

/**
 * ابحث عن نفس الخبر في مصادر متعددة.
 */
export async function crossReferenceArticle(
  articleTitle: string,
  articleBody: string,
  sourceUrl?: string
): Promise<CrossReferenceResult> {
  // If AI not configured, return neutral result
  if (!isAIConfigured()) {
    return {
      ok: true,
      sourcesFound: 0,
      sources: [],
      consistentFacts: [],
      conflictingFacts: [],
      confidence: 50,
      needsManualReview: false,
      recommendation: 'AI غير مُفعّل - التحقق المتقاطع غير متاح',
    }
  }

  const zai = getZAI()

  try {
    // Extract key search terms from the title (remove stop words)
    const searchQuery = extractSearchQuery(articleTitle)

    // Use Z.ai to search for the same news
    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a news cross-reference system. Search for the same news story from multiple sources and verify facts.

Task:
1. Find 3-5 other sources reporting the SAME news
2. Extract key facts (numbers, dates, names, locations)
3. Compare facts across all sources
4. Identify any CONFLICTING facts (different numbers, different names, etc.)
5. Identify CONSISTENT facts (agreed upon by all sources)

Return ONLY valid JSON:
{
  "sources": [
    {"title": "...", "url": "...", "snippet": "...", "source": "...", "publishedTime": "..."}
  ],
  "consistentFacts": ["fact agreed by all", "..."],
  "conflictingFacts": [
    {"fact": "number of casualties", "variations": ["50", "45", "dozens"], "sources": ["source1", "source2"]}
  ],
  "confidence": 0-100,
  "recommendation": "verified | needs review | conflicting reports"
}`,
        },
        {
          role: 'user',
          content: `Verify this news article by cross-referencing with other sources:

TITLE: ${articleTitle}
CONTENT (excerpt): ${articleBody.slice(0, 1500)}
ORIGINAL SOURCE: ${sourceUrl || 'unknown'}

Search for: "${searchQuery}"

Find at least 3 other sources reporting this same news and compare the facts.`,
        },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    })

    const content = response?.choices?.[0]?.message?.content || '{}'
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    const sources: CrossReferenceSource[] = Array.isArray(parsed.sources)
      ? parsed.sources.slice(0, 5)
      : []

    const conflictingFacts = Array.isArray(parsed.conflictingFacts)
      ? parsed.conflictingFacts
      : []

    const confidence = Math.min(100, Math.max(0, parsed.confidence || 50))
    const needsManualReview = conflictingFacts.length > 2 || confidence < 50

    return {
      ok: true,
      sourcesFound: sources.length,
      sources,
      consistentFacts: Array.isArray(parsed.consistentFacts) ? parsed.consistentFacts : [],
      conflictingFacts,
      confidence,
      needsManualReview,
      recommendation: parsed.recommendation || (needsManualReview ? 'needs review' : 'verified'),
    }
  } catch (e: any) {
    console.error('Cross-reference failed:', e.message)
    return {
      ok: false,
      sourcesFound: 0,
      sources: [],
      consistentFacts: [],
      conflictingFacts: [],
      confidence: 50,
      needsManualReview: false,
      recommendation: `فشل التحقق المتقاطع: ${e.message}`,
    }
  }
}

// ===== Helpers =====

function extractSearchQuery(title: string): string {
  // Remove common Arabic stop words and keep key terms
  const stopWords = new Set([
    'في', 'من', 'إلى', 'على', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'التي', 'الذي',
    'قال', 'يقول', 'أكد', 'أعلن', 'كون', 'بعد', 'قبل', 'خلال', 'أثناء',
    'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  ])

  return title
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w.toLowerCase()))
    .slice(0, 8)
    .join(' ')
}
