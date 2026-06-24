/**
 * AI Summary Generator — creates TL;DR + key points + reading metrics
 * for each article using Z.ai.
 */

import { getZAI, isAIConfigured } from '@/lib/zai'
import { db } from '@/lib/db'

export interface SummaryResult {
  summaryAr: string
  summaryEn: string
  keyPoints: string[]
  readingTime: number      // minutes
  readabilityScore: number // 0-100 (higher = easier)
  clickbaitScore: number   // 0-100 (lower = less clickbait)
  sentiment: 'positive' | 'negative' | 'neutral'
  model: string
}

export async function generateArticleSummary(article: {
  id: string
  titleAr: string
  bodyAr: string
  leadAr: string | null
}): Promise<SummaryResult> {
  // Fallback if AI not configured
  if (!isAIConfigured()) {
    return fallbackSummary(article)
  }

  const zai = getZAI()
  const content = `${article.titleAr}\n\n${article.leadAr || ''}\n\n${article.bodyAr}`.slice(0, 5000)

  const prompt = `Analyze this Arabic news article and generate a comprehensive summary.

ARTICLE:
${content}

Return ONLY valid JSON with this exact structure:
{
  "summaryAr": "ملخص في 2-3 جمل بالعربية يلتقط جوهر المقال",
  "summaryEn": "2-3 sentence English summary",
  "keyPoints": ["نقطة 1", "نقطة 2", "نقطة 3", "نقطة 4"],
  "readabilityScore": 0-100 (higher = easier to read),
  "clickbaitScore": 0-100 (lower = less clickbait-y title),
  "sentiment": "positive" | "negative" | "neutral"
}

Rules:
- keyPoints: 3-5 bullet points, each 5-15 words
- readabilityScore: based on sentence complexity, vocabulary level
- clickbaitScore: 0 if factual, 100 if "You won't believe..."
- sentiment: overall tone of the article`

  try {
    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an expert news analyst. Respond only with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 800,
    })

    const result = response?.choices?.[0]?.message?.content || '{}'
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    // Calculate reading time (200 wpm for Arabic)
    const wordCount = article.bodyAr.split(/\s+/).length
    const readingTime = Math.max(1, Math.round(wordCount / 200))

    const summary: SummaryResult = {
      summaryAr: parsed.summaryAr || article.leadAr || article.titleAr,
      summaryEn: parsed.summaryEn || '',
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 5) : [],
      readingTime,
      readabilityScore: parsed.readabilityScore ?? 70,
      clickbaitScore: parsed.clickbaitScore ?? 20,
      sentiment: parsed.sentiment || 'neutral',
      model: 'glm-4-flash',
    }

    // Save to DB
    await db.articleSummary.upsert({
      where: { articleId: article.id },
      update: {
        summaryAr: summary.summaryAr,
        summaryEn: summary.summaryEn,
        keyPoints: JSON.stringify(summary.keyPoints),
        readingTime: summary.readingTime,
        readabilityScore: summary.readabilityScore,
        clickbaitScore: summary.clickbaitScore,
        sentiment: summary.sentiment,
        aiModel: summary.model,
      },
      create: {
        articleId: article.id,
        summaryAr: summary.summaryAr,
        summaryEn: summary.summaryEn,
        keyPoints: JSON.stringify(summary.keyPoints),
        readingTime: summary.readingTime,
        readabilityScore: summary.readabilityScore,
        clickbaitScore: summary.clickbaitScore,
        sentiment: summary.sentiment,
        aiModel: summary.model,
      },
    })

    return summary
  } catch (e: any) {
    console.error('Summary generation failed:', e.message)
    return fallbackSummary(article)
  }
}

function fallbackSummary(article: any): SummaryResult {
  const wordCount = article.bodyAr.split(/\s+/).length
  const readingTime = Math.max(1, Math.round(wordCount / 200))
  const summary = (article.leadAr || article.titleAr).slice(0, 200)

  return {
    summaryAr: summary,
    summaryEn: '',
    keyPoints: [],
    readingTime,
    readabilityScore: 70,
    clickbaitScore: 20,
    sentiment: 'neutral',
    model: 'fallback',
  }
}

/**
 * Get summary for an article (from DB or generate).
 */
export async function getArticleSummary(articleId: string): Promise<SummaryResult | null> {
  const existing = await db.articleSummary.findUnique({
    where: { articleId },
  })
  if (existing) {
    return {
      summaryAr: existing.summaryAr,
      summaryEn: existing.summaryEn || '',
      keyPoints: existing.keyPoints ? JSON.parse(existing.keyPoints) : [],
      readingTime: existing.readingTime || 1,
      readabilityScore: existing.readabilityScore || 70,
      clickbaitScore: existing.clickbaitScore || 20,
      sentiment: (existing.sentiment as any) || 'neutral',
      model: existing.aiModel || 'fallback',
    }
  }
  return null
}
