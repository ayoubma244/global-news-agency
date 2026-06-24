/**
 * Content Deduplication System
 * ==============================
 * يكتشف المقالات المكررة (نفس الخبر من مصادر مختلفة)
 *
 * الخوارزمية:
 * 1. SimHash - fingerprint سريع للمقارنة
 * 2. Jaccard similarity - للتأكد
 * 3. Title similarity - مقارنة العناوين
 *
 * إذا تشابه مقالان > 80% → يُدمجان أو يُحذف الأحدث
 */

import { db } from '@/lib/db'

export interface DuplicateResult {
  isDuplicate: boolean
  similarity: number  // 0-100
  originalArticle?: {
    id: string
    slug: string
    titleAr: string
    sourceName: string | null
    publishedAt: Date | null
  }
  action: 'publish' | 'skip' | 'merge' | 'flag'
  reason: string
}

/**
 * تحقق إذا كان مقال مكرر لمقال موجود.
 */
export async function checkDuplicate(
  title: string,
  body: string,
  sourceUrl: string
): Promise<DuplicateResult> {
  // 1. Exact URL match (fastest check)
  const exactMatch = await db.article.findFirst({
    where: { sourceUrl },
    select: { id: true, slug: true, titleAr: true, sourceName: true, publishedAt: true, bodyAr: true },
  })

  if (exactMatch) {
    return {
      isDuplicate: true,
      similarity: 100,
      originalArticle: exactMatch,
      action: 'skip',
      reason: 'نفس الرابط المصدر مُعالج مسبقاً',
    }
  }

  // 2. Title similarity (check last 100 articles)
  const recentArticles = await db.article.findMany({
    where: { status: { in: ['published', 'draft', 'needs_review'] } },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: { id: true, slug: true, titleAr: true, titleEn: true, bodyAr: true, sourceName: true, publishedAt: true },
  })

  // Calculate title similarity for each
  const titleFingerprint = simHash(normalizeText(title))
  let bestMatch: any = null
  let bestSimilarity = 0

  for (const article of recentArticles) {
    // Skip if same source URL already checked
    const titleSim = titleSimilarity(title, article.titleAr)
    const bodySim = bodySimilarity(body, article.bodyAr)

    // Combined score (title weight 60%, body weight 40%)
    const combinedSim = titleSim * 0.6 + bodySim * 0.4

    if (combinedSim > bestSimilarity) {
      bestSimilarity = combinedSim
      bestMatch = article
    }
  }

  if (bestSimilarity >= 90) {
    return {
      isDuplicate: true,
      similarity: Math.round(bestSimilarity),
      originalArticle: bestMatch,
      action: 'skip',
      reason: 'مقال مكرر - نفس الخبر تقريباً',
    }
  }

  if (bestSimilarity >= 75) {
    return {
      isDuplicate: true,
      similarity: Math.round(bestSimilarity),
      originalArticle: bestMatch,
      action: 'flag',
      reason: 'مشابه جداً لمقال موجود - يحتاج مراجعة',
    }
  }

  if (bestSimilarity >= 60) {
    return {
      isDuplicate: false,
      similarity: Math.round(bestSimilarity),
      originalArticle: bestMatch,
      action: 'flag',
      reason: 'مشابه لمقال موجود - قد يكون تحديثاً للخبر',
    }
  }

  return {
    isDuplicate: false,
    similarity: Math.round(bestSimilarity),
    action: 'publish',
    reason: 'محتوى أصلي',
  }
}

// ===== Similarity Algorithms =====

/**
 * SimHash - fingerprint سريع للمقارنة.
 */
function simHash(text: string, hashBits: number = 64): bigint {
  const tokens = text.split(/\s+/).filter(t => t.length > 2)
  if (tokens.length === 0) return 0n

  const vector = new Array(hashBits).fill(0)

  for (const token of tokens) {
    const hash = simpleHash(token)
    for (let i = 0; i < hashBits; i++) {
      const bit = (hash >> BigInt(i)) & 1n
      vector[i] += bit === 1n ? 1 : -1
    }
  }

  let result = 0n
  for (let i = 0; i < hashBits; i++) {
    if (vector[i] > 0) {
      result |= (1n << BigInt(i))
    }
  }

  return result
}

function simpleHash(str: string): bigint {
  let hash = 0n
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31n) + BigInt(str.charCodeAt(i))
  }
  return hash
}

/**
 * Hamming distance between two SimHash fingerprints.
 */
function hammingDistance(a: bigint, b: bigint): number {
  let xor = a ^ b
  let distance = 0
  while (xor > 0n) {
    if (xor & 1n) distance++
    xor >>= 1n
  }
  return distance
}

/**
 * Title similarity (0-100).
 */
function titleSimilarity(a: string, b: string): number {
  const normA = normalizeText(a)
  const normB = normalizeText(b)

  if (normA === normB) return 100

  // Word-level Jaccard similarity
  const wordsA = new Set(normA.split(/\s+/))
  const wordsB = new Set(normB.split(/\s+/))
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)))
  const union = new Set([...wordsA, ...wordsB])
  const jaccard = union.size > 0 ? intersection.size / union.size : 0

  // SimHash similarity
  const hashA = simHash(normA)
  const hashB = simHash(normB)
  const distance = hammingDistance(hashA, hashB)
  const simHashSimilarity = 1 - distance / 64

  // Combined (50% Jaccard + 50% SimHash)
  return Math.round((jaccard * 0.5 + simHashSimilarity * 0.5) * 100)
}

/**
 * Body similarity (0-100) - uses first 500 words for performance.
 */
function bodySimilarity(a: string, b: string): number {
  const normA = normalizeText(a).split(/\s+/).slice(0, 500).join(' ')
  const normB = normalizeText(b).split(/\s+/).slice(0, 500).join(' ')

  if (normA === normB) return 100

  const hashA = simHash(normA)
  const hashB = simHash(normB)
  const distance = hammingDistance(hashA, hashB)

  return Math.round((1 - distance / 64) * 100)
}

/**
 * Normalize text for comparison.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
